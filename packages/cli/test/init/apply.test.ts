// packages/cli/test/init/apply.test.ts
import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyPlan, type ApplyDeps } from "../../src/init/apply";
import { planInit, fsView } from "../../src/init/plan";
import { detect } from "../../src/init/detect";

function fakeDeps(templatesDir = join(tmpdir(), "no-templates")): ApplyDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    templatesDir,
    install: async (pm, pkgs, full) => { calls.push(`install ${pm} ${full ? "full " : ""}${pkgs.join(" ")}`); },
    codegen: async (dir) => { calls.push(`codegen ${dir}`); mkdirSync(join(dir, "_generated"), { recursive: true }); writeFileSync(join(dir, "_generated", "api.d.ts"), "// real codegen output"); },
  };
}

describe("applyPlan", () => {
  it("existing app: writes files, merges env/gitignore, never overwrites, installs once, then codegen", async () => {
    const root = mkdtempSync(join(tmpdir(), "apply-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", devDependencies: { vite: "6" } }));
    writeFileSync(join(root, ".env.local"), "SECRET=keep\r\n");
    writeFileSync(join(root, ".gitignore"), "node_modules\n");
    const info = detect(root, {});
    const actions = planInit(info, { starter: null, components: ["auth"], db: "sqlite", databaseUrl: null }, fsView(root));
    const deps = fakeDeps();
    await applyPlan(root, info, actions, deps);

    expect(readFileSync(join(root, ".env.local"), "utf8")).toBe("SECRET=keep\r\nVITE_CONCILE_URL=ws://127.0.0.1:3000/api/sync\r\n");
    expect(readFileSync(join(root, ".gitignore"), "utf8")).toContain("# concile\n.concile/\n.env.local\n");
    expect(existsSync(join(root, "concile", "schema.ts"))).toBe(true);
    expect(existsSync(join(root, "concile", "_generated", "server.ts"))).toBe(true); // stub before codegen
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toContain("<!-- concile:start -->");
    expect(deps.calls.filter((c) => c.startsWith("install")).length).toBe(1);
    expect(deps.calls.at(-1)).toBe(`codegen ${join(root, "concile")}`);
  });

  it("re-running after apply plans nothing new except codegen-free no-ops", async () => {
    const root = mkdtempSync(join(tmpdir(), "apply2-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: { concile: "1", "@concile/values": "1", "@concile/client": "1", "@concile/executor": "1", "@concile/id-codec": "1", "@concile/component": "1", "@concile/auth": "1" } }));
    const answers = { starter: null, components: ["auth" as const], db: "sqlite" as const, databaseUrl: null };
    await applyPlan(root, detect(root, {}), planInit(detect(root, {}), answers, fsView(root)), fakeDeps());
    expect(planInit(detect(root, {}), answers, fsView(root))).toEqual([]);
  });

  it("a config it cannot edit becomes a manual step and the file is left alone", async () => {
    const root = mkdtempSync(join(tmpdir(), "apply3-"));
    mkdirSync(join(root, "concile"));
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "concile.config.ts"), "export default makeIt();\n");
    const info = detect(root, {});
    const res = await applyPlan(root, info, [{ kind: "config", add: ["scheduler"], remove: [] }], fakeDeps());
    expect(readFileSync(join(root, "concile.config.ts"), "utf8")).toBe("export default makeIt();\n");
    expect(res.manual.join("\n")).toContain("@concile/scheduler");
  });
});

describe("applyPlan agents", () => {
  it("a damaged marker block becomes a manual step and the file is left alone", async () => {
    const root = mkdtempSync(join(tmpdir(), "apply4-"));
    const damaged = "# Notes\n<!-- concile:start -->\nold stuff\n";
    writeFileSync(join(root, "AGENTS.md"), damaged);
    const res = await applyPlan(root, detect(root, {}), [{ kind: "agents", files: ["AGENTS.md"] }], fakeDeps());
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toBe(damaged);
    expect(res.done).not.toContain("AGENTS.md");
    expect(res.manual.join("\n")).toContain("AGENTS.md has a damaged concile marker block");
  });
});

describe("applyPlan file modes", () => {
  it.skipIf(process.platform === "win32")("keeps an existing file's permissions when it merges into it", async () => {
    const { chmodSync, statSync } = await import("node:fs");
    const root = mkdtempSync(join(tmpdir(), "apply5-"));
    writeFileSync(join(root, ".env.local"), "SECRET=keep\n");
    chmodSync(join(root, ".env.local"), 0o600);
    await applyPlan(root, detect(root, {}), [{ kind: "env", keys: [{ key: "CONCILE_URL", value: "x" }] }], fakeDeps());
    expect(readFileSync(join(root, ".env.local"), "utf8")).toBe("SECRET=keep\nCONCILE_URL=x\n");
    expect(statSync(join(root, ".env.local")).mode & 0o777).toBe(0o600);
  });
});

describe("applyPlan symlinks", () => {
  it.skipIf(process.platform === "win32")("CLAUDE.md -> AGENTS.md stays a link and the block is written once", async () => {
    const { symlinkSync, lstatSync } = await import("node:fs");
    const root = mkdtempSync(join(tmpdir(), "apply-link1-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a" }));
    writeFileSync(join(root, "AGENTS.md"), "# Agents\n");
    symlinkSync("AGENTS.md", join(root, "CLAUDE.md"));
    const answers = { starter: null, components: ["auth" as const], db: "sqlite" as const, databaseUrl: null };
    const actions = planInit(detect(root, {}), answers, fsView(root));
    expect(actions.find((x) => x.kind === "agents")).toMatchObject({ files: ["AGENTS.md"] });
    await applyPlan(root, detect(root, {}), actions, fakeDeps());
    expect(lstatSync(join(root, "CLAUDE.md")).isSymbolicLink()).toBe(true);
    const text = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(text.split("<!-- concile:start -->").length - 1).toBe(1);
    expect(readFileSync(join(root, "CLAUDE.md"), "utf8")).toBe(text);
  });

  it.skipIf(process.platform === "win32")(".env.local -> other/env keeps the link and the target gets the key", async () => {
    const { symlinkSync, lstatSync } = await import("node:fs");
    const root = mkdtempSync(join(tmpdir(), "apply-link2-"));
    mkdirSync(join(root, "other"));
    writeFileSync(join(root, "other", "env"), "SECRET=keep\n");
    symlinkSync(join("other", "env"), join(root, ".env.local"));
    await applyPlan(root, detect(root, {}), [{ kind: "env", keys: [{ key: "CONCILE_URL", value: "x" }] }], fakeDeps());
    expect(lstatSync(join(root, ".env.local")).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(root, "other", "env"), "utf8")).toBe("SECRET=keep\nCONCILE_URL=x\n");
    expect(existsSync(join(root, "other", "env.concile-tmp"))).toBe(false);
  });
});

describe("writeAtomic failure", () => {
  it("removes its temp file when the rename fails", async () => {
    const { writeAtomic } = await import("../../src/init/apply");
    const { readdirSync } = await import("node:fs");
    const root = mkdtempSync(join(tmpdir(), "apply-tmp-"));
    // A non-empty directory at the target path makes renameSync(file, dir) throw.
    mkdirSync(join(root, "target", "inner"), { recursive: true });
    expect(() => writeAtomic(join(root, "target"), "x")).toThrow();
    expect(readdirSync(root)).toEqual(["target"]);
  });
});

describe("runCommand", () => {
  it("drains a child that prints more than 1MB to stdout", async () => {
    const { runCommand } = await import("../../src/init/apply");
    await expect(runCommand(process.execPath, ["-e", "process.stdout.write('x'.repeat(2 * 1024 * 1024))"], tmpdir())).resolves.toBeUndefined();
  }, 20000);

  it("a failing command reports the stdout and stderr tail", async () => {
    const { runCommand } = await import("../../src/init/apply");
    await expect(runCommand(process.execPath, ["-e", "console.log('out-msg'); console.error('err-msg'); process.exit(3)"], tmpdir()))
      .rejects.toThrow(/exit 3\)[\s\S]*out-msg[\s\S]*err-msg/);
  });
});

describe("ApplyError", () => {
  it("a failing step throws ApplyError carrying what was done so far", async () => {
    const { ApplyError } = await import("../../src/init/apply");
    const root = mkdtempSync(join(tmpdir(), "apply-err-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a" }));
    const deps = fakeDeps();
    deps.install = async () => { throw new Error("npm install failed (exit 1)\nE404 tail"); };
    const answers = { starter: null, components: ["auth" as const], db: "sqlite" as const, databaseUrl: null };
    const err = await applyPlan(root, detect(root, {}), planInit(detect(root, {}), answers, fsView(root)), deps).catch((e) => e);
    expect(err).toBeInstanceOf(ApplyError);
    expect(err.message).toContain("E404 tail");
    expect(err.done).toEqual(expect.arrayContaining(["concile/schema.ts", "concile.config.ts", ".env.local", ".gitignore", "AGENTS.md"]));
    expect(err.done).not.toContain("install");
  });
});

describe("install commands (one install, pinned versions)", () => {
  it("a starter runs one command that adds the packages; nothing else", async () => {
    const { installCommands } = await import("../../src/init/apply");
    expect(installCommands("npm", ["concile", "react"], true, "0.2.0")).toEqual([["install", "concile@^0.2.0", "react"]]);
    expect(installCommands("pnpm", ["@concile/auth"], true, "0.2.0")).toEqual([["add", "@concile/auth@^0.2.0"]]);
    expect(installCommands("yarn", [], true, "0.2.0")).toEqual([["install"]]);
    expect(installCommands("bun", [], false, "0.2.0")).toEqual([]);
  });
  it("pins concile and @concile/* to the CLI version, prereleases included; a source checkout pins nothing", async () => {
    const { pinPackages } = await import("../../src/init/apply");
    expect(pinPackages(["concile", "@concile/values", "left-pad"], "0.3.0-beta.1")).toEqual(["concile@^0.3.0-beta.1", "@concile/values@^0.3.0-beta.1", "left-pad"]);
    expect(pinPackages(["concile"], "dev")).toEqual(["concile"]);
  });
});

describe("applyPlan starter into a fresh clone", () => {
  it("merges the starter's gitignore into an existing .gitignore and keeps README", async () => {
    const tpl = mkdtempSync(join(tmpdir(), "tpl-"));
    mkdirSync(join(tpl, "vite"));
    writeFileSync(join(tpl, "vite", "_gitignore"), "node_modules\ndist\n");
    writeFileSync(join(tpl, "vite", "package.json"), JSON.stringify({ name: "concile-app" }));
    writeFileSync(join(tpl, "vite", "README.md"), "template readme");
    const root = mkdtempSync(join(tmpdir(), "apply-clone-"));
    writeFileSync(join(root, "README.md"), "# mine\n");
    writeFileSync(join(root, ".gitignore"), "*.log\n");
    await applyPlan(root, detect(root, {}), [{ kind: "copyTemplate", template: "vite", name: "my-app" }], fakeDeps(tpl));
    expect(readFileSync(join(root, "README.md"), "utf8")).toBe("# mine\n");
    expect(readFileSync(join(root, ".gitignore"), "utf8")).toBe("*.log\n\n# concile\nnode_modules\ndist\n");
    expect(existsSync(join(root, "_gitignore"))).toBe(false);
  });
});

describe("applyPlan custom functionsDir", () => {
  it("codegen and the stub target the configured directory", async () => {
    const root = mkdtempSync(join(tmpdir(), "apply-fdir-"));
    mkdirSync(join(root, "backend"));
    const deps = fakeDeps();
    const info = { ...detect(root, {}, undefined, "backend") };
    await applyPlan(root, info, [{ kind: "codegen" }], deps);
    expect(deps.calls).toEqual([`codegen ${join(root, "backend")}`]);
    expect(existsSync(join(root, "backend", "_generated", "server.ts"))).toBe(true);
    expect(existsSync(join(root, "concile"))).toBe(false);
  });
});
