import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initCommand, addCommand } from "../../src/init/command";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { ApplyDeps } from "../../src/init/apply";
import { plainPrompter } from "../../src/init/prompts";

function deps(cwd: string, out: string[]) {
  const apply: ApplyDeps = { templatesDir: join(tmpdir(), "none"), install: async () => {}, codegen: async (dir) => { mkdirSync(join(dir, "_generated"), { recursive: true }); writeFileSync(join(dir, "_generated", "api.d.ts"), "// real codegen output"); } };
  return { cwd, env: {}, stdinTTY: false, stdoutTTY: false, write: (s: string) => { out.push(s); }, prompter: null, apply, startDev: async () => 0, migrate: async () => 0 };
}

describe("initCommand (non-interactive)", () => {
  it("a stub-only _generated/server.ts is not 'already set up': codegen still runs", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd-stub-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: { concile: "1", "@concile/values": "1", "@concile/client": "1", "@concile/executor": "1", "@concile/id-codec": "1", "@concile/component": "1", "@concile/auth": "1" } }));
    await initCommand(["--yes", "--no-install", "--starter", "none"], deps(root, []));
    rmSync(join(root, "concile", "_generated"), { recursive: true, force: true });
    mkdirSync(join(root, "concile", "_generated"), { recursive: true });
    writeFileSync(join(root, "concile", "_generated", "server.ts"), "// stub");
    const out: string[] = [];
    let ran = 0;
    const d = deps(root, out);
    d.apply = { ...d.apply, codegen: async () => { ran++; } };
    expect(await initCommand(["--yes", "--no-install"], d)).toBe(0);
    expect(ran).toBe(1);
    expect(out.join("")).not.toContain("Already set up");
  });

  it("never waits on stdin and finishes in an existing app", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", devDependencies: { vite: "6" } }));
    const out: string[] = [];
    const started = Date.now();
    const code = await initCommand([], deps(root, out));
    expect(code).toBe(0);
    expect(Date.now() - started).toBeLessThan(5000);
    expect(existsSync(join(root, "concile.config.ts"))).toBe(true);
    const text = out.join("");
    expect(text).toContain("concile init v");
    expect(text).toContain("npx concile init --yes"); // reproducible command
    expect(text).toContain("VITE_CONCILE_URL"); // snippet / env mention
  });

  it("creates the folder when given one", async () => {
    const parent = mkdtempSync(join(tmpdir(), "cmd2-"));
    const code = await initCommand(["my-app", "--starter", "none"], deps(parent, []));
    expect(code).toBe(0);
    expect(existsSync(join(parent, "my-app", "concile", "schema.ts"))).toBe(true);
  });

  it("refuses a loose folder (files, no package.json) with a hint", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd3-"));
    writeFileSync(join(root, "notes.txt"), "hi");
    const out: string[] = [];
    expect(await initCommand([], deps(root, out))).toBe(1);
    expect(out.join("")).toContain("npx concile init my-app");
    expect(readdirSync(root)).toEqual(["notes.txt"]);
  });

  it("loose folder holding a project: points at it and never suggests a taken name", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd3b-"));
    mkdirSync(join(root, "my-app"));
    writeFileSync(join(root, "my-app", "package.json"), "{}");
    writeFileSync(join(root, ".DS_Store"), "");
    const out: string[] = [];
    expect(await initCommand([], deps(root, out))).toBe(1);
    const text = out.join("");
    expect(text).toContain("To set up my-app:  npx concile init my-app");
    expect(text).toContain("To start a new app:  npx concile init my-app-2");
  });

  it("loose folder, interactive: picking a child project runs init inside it", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd3c-"));
    mkdirSync(join(root, "web"));
    writeFileSync(join(root, "web", "package.json"), JSON.stringify({ name: "web", devDependencies: { vite: "6" } }));
    writeFileSync(join(root, "notes.txt"), "hi");
    let asked: { projects: string[]; suggested: string } | null = null;
    const ui = {
      ...plainPrompter(() => {}),
      askLoose: async (projects: string[], suggested: string) => { asked = { projects, suggested }; return "web"; },
      askRecommended: async () => true,
      askStartDev: async () => false,
    };
    const d = { ...deps(root, []), stdinTTY: true, stdoutTTY: true, prompter: ui };
    expect(await initCommand(["--no-install"], d)).toBe(0);
    expect(asked).toEqual({ projects: ["web"], suggested: "my-app" });
    expect(existsSync(join(root, "web", "concile.config.ts"))).toBe(true);
    expect(existsSync(join(root, "concile.config.ts"))).toBe(false);
  });

  it("loose folder, interactive: a new name creates the app in that folder", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd3d-"));
    writeFileSync(join(root, "notes.txt"), "hi");
    const ui = {
      ...plainPrompter(() => {}),
      askLoose: async () => "fresh",
      askRecommended: async () => false,
      askStarter: async () => "none" as const,
      askComponents: async () => [],
      askDb: async () => ({ db: "sqlite" as const, url: null }),
      askStartDev: async () => false,
    };
    const d = { ...deps(root, []), stdinTTY: true, stdoutTTY: true, prompter: ui };
    expect(await initCommand(["--no-install"], d)).toBe(0);
    expect(existsSync(join(root, "fresh", "concile", "schema.ts"))).toBe(true);
  });

  it("Convex project points to concile migrate and changes nothing", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd4-"));
    writeFileSync(join(root, "package.json"), "{}");
    mkdirSync(join(root, "convex"));
    const out: string[] = [];
    expect(await initCommand([], deps(root, out))).toBe(1);
    expect(out.join("")).toContain("concile migrate");
  });

  it("--dry-run writes nothing; --json prints the plan", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd5-"));
    writeFileSync(join(root, "package.json"), "{}");
    const out: string[] = [];
    expect(await initCommand(["--dry-run", "--json"], deps(root, out))).toBe(0);
    expect(existsSync(join(root, "concile"))).toBe(false);
    const json = JSON.parse(out.join(""));
    expect(json.dryRun).toBe(true);
    expect(json.actions.length).toBeGreaterThan(0);
  });

  it("re-run reports already set up", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd6-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: { concile: "1", "@concile/values": "1", "@concile/client": "1", "@concile/executor": "1", "@concile/id-codec": "1", "@concile/component": "1", "@concile/auth": "1" } }));
    await initCommand([], deps(root, []));
    const out: string[] = [];
    expect(await initCommand([], deps(root, out))).toBe(0);
    expect(out.join("")).toContain("Already set up");
  });

  it("old Node stops before anything", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd7-"));
    const out: string[] = [];
    expect(await initCommand([], { ...deps(root, out), nodeVersion: "20.0.0" } as never)).toBe(1);
    expect(out.join("")).toContain("22.18");
  });
});

describe("initCommand (failures and overrides)", () => {
  it("install failure keeps written files, lists what was done, says to re-run", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd8-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", devDependencies: { vite: "6" } }));
    const out: string[] = [];
    const d = deps(root, out);
    d.apply = { ...d.apply, install: async () => { throw new Error("npm install failed (exit 1)\nnetwork is down"); } };
    expect(await initCommand([], d)).toBe(1);
    const text = out.join("");
    expect(text).toContain("concile/schema.ts");
    expect(text).toContain("network is down");
    expect(text).toContain("Files written so far are kept. Run the same command again to finish.");
    expect(existsSync(join(root, "concile", "schema.ts"))).toBe(true);
  });

  it("--pm overrides the lockfile", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd9-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a" }));
    writeFileSync(join(root, "pnpm-lock.yaml"), "");
    const seen: string[] = [];
    const d = deps(root, []);
    d.apply = { ...d.apply, install: async (pm) => { seen.push(pm); } };
    expect(await initCommand(["--pm", "npm"], d)).toBe(0);
    expect(seen).toEqual(["npm"]);
  });

  it("prints each assumed default with its flag, and the agent hint when an agent runs it", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd10-"));
    writeFileSync(join(root, "package.json"), "{}");
    const out: string[] = [];
    expect(await initCommand([], { ...deps(root, out), env: { CLAUDECODE: "1" } })).toBe(0);
    const text = out.join("");
    expect(text).toContain("--components");
    expect(text).toContain("--db");
    expect(text).toContain("\x1b[8m");
    expect(text).toContain("npx concile init --help");
  });

  it("an unknown flag prints help and exits 1", async () => {
    const out: string[] = [];
    expect(await initCommand(["--nope"], deps(mkdtempSync(join(tmpdir(), "cmd11-")), out))).toBe(1);
    expect(out.join("")).toContain("unknown option: --nope");
  });

  it("a new folder is not created when the run stops early", async () => {
    const parent = mkdtempSync(join(tmpdir(), "cmd12-"));
    expect(await initCommand(["my-app", "--dry-run"], deps(parent, []))).toBe(0);
    expect(existsSync(join(parent, "my-app"))).toBe(false);
  });

  it("--json reports failures as JSON", async () => {
    const root = mkdtempSync(join(tmpdir(), "cmd13-"));
    writeFileSync(join(root, "notes.txt"), "hi");
    const out: string[] = [];
    expect(await initCommand(["--json"], deps(root, out))).toBe(1);
    const json = JSON.parse(out.join(""));
    expect(json.ok).toBe(false);
    expect(json.error).toContain("npx concile init my-app");
  });
});

describe("initCommand (review fixes)", () => {
  const CORE = { concile: "1", "@concile/values": "1", "@concile/client": "1", "@concile/executor": "1", "@concile/id-codec": "1", "@concile/component": "1" };

  it("re-run on a project with no components keeps none (does not add auth)", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix1-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: CORE }));
    expect(await initCommand(["--components", ""], deps(root, []))).toBe(0);
    expect(readFileSync(join(root, "concile.config.ts"), "utf8")).toMatch(/components:\s*\[\s*\]/);
    const out: string[] = [];
    expect(await initCommand(["--yes", "--dry-run", "--json"], deps(root, out))).toBe(0);
    const plan = JSON.parse(out.join(""));
    expect(plan.answers.components).toEqual([]);
    expect(plan.actions.filter((a: { kind: string }) => a.kind === "config" || a.kind === "install")).toEqual([]);
    const out2: string[] = [];
    expect(await initCommand(["--yes"], deps(root, out2))).toBe(0);
    expect(out2.join("")).toContain("Already set up");
  });

  it("a Concile project without a config gets components: [] (no auth added)", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix5-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: CORE }));
    mkdirSync(join(root, "concile"));
    writeFileSync(join(root, "concile", "schema.ts"), "export default {};\n");
    const installs: string[][] = [];
    const d = deps(root, []);
    d.apply = { ...d.apply, install: async (_pm, pkgs) => { installs.push(pkgs); } };
    expect(await initCommand(["--yes"], d)).toBe(0);
    expect(readFileSync(join(root, "concile.config.ts"), "utf8")).toMatch(/components:\s*\[\s*\]/);
    expect(installs.flat()).not.toContain("@concile/auth");
    const out: string[] = [];
    expect(await initCommand(["--yes"], deps(root, out))).toBe(0);
    expect(out.join("")).toContain("Already set up");
  });

  it("--json never echoes the database URL", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix2-"));
    writeFileSync(join(root, "package.json"), "{}");
    const url = "postgres://u:s3cret@h:5432/db";
    const dry: string[] = [];
    expect(await initCommand(["--json", "--dry-run", "--database-url", url], deps(root, dry))).toBe(0);
    const plan = JSON.parse(dry.join(""));
    expect(dry.join("")).not.toContain("s3cret");
    expect(plan.answers.databaseUrl).toBe("***");
    const env = plan.actions.find((a: { kind: string }) => a.kind === "env");
    expect(env.keys.find((k: { key: string }) => k.key === "CONCILE_DATABASE_URL").value).toBe("***");
    const real: string[] = [];
    expect(await initCommand(["--json", "--database-url", url], deps(root, real))).toBe(0);
    expect(real.join("")).not.toContain("s3cret");
    expect(JSON.parse(real.join("")).answers.databaseUrl).toBe("***");
    // The real value still lands in .env.local.
    expect(readFileSync(join(root, ".env.local"), "utf8")).toContain(url);
  });

  it("interactive Convex project offers migrate and runs it on yes", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix3-"));
    writeFileSync(join(root, "package.json"), "{}");
    mkdirSync(join(root, "convex"));
    const ran: string[] = [];
    const ui = { ...plainPrompter(() => {}), askMigrate: async () => true };
    const d = { ...deps(root, []), stdinTTY: true, stdoutTTY: true, prompter: ui, migrate: async (r: string) => { ran.push(r); return 7; } };
    expect(await initCommand([], d)).toBe(7);
    expect(ran).toEqual([root]);
  });

  it("interactive Convex project, answering no, changes nothing and exits 0", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix4-"));
    writeFileSync(join(root, "package.json"), "{}");
    mkdirSync(join(root, "convex"));
    const out: string[] = [];
    const ui = { ...plainPrompter((s) => out.push(s)), askMigrate: async () => false };
    const d = { ...deps(root, out), stdinTTY: true, stdoutTTY: true, prompter: ui, migrate: async () => { throw new Error("must not run"); } };
    expect(await initCommand([], d)).toBe(0);
    expect(out.join("")).toContain("npx concile migrate");
    expect(readdirSync(root).sort()).toEqual(["convex", "package.json"]);
  });
});

describe("addCommand", () => {
  it("adds a component (and its requirement) to an existing project", async () => {
    const root = mkdtempSync(join(tmpdir(), "add-"));
    writeFileSync(join(root, "package.json"), "{}");
    await initCommand(["--components", "auth"], deps(root, []));
    expect(await addCommand(["workflow"], deps(root, []))).toBe(0);
    const cfg = readFileSync(join(root, "concile.config.ts"), "utf8");
    expect(cfg).toContain("defineScheduler()");
    expect(cfg).toContain("defineWorkflow(");
  });
  it("outside a Concile project it says to run init first", async () => {
    const root = mkdtempSync(join(tmpdir(), "add2-"));
    const out: string[] = [];
    expect(await addCommand(["auth"], deps(root, out))).toBe(1);
    expect(out.join("")).toContain("npx concile init");
  });
});

describe("final fix wave", () => {
  const CORE = { concile: "1", "@concile/values": "1", "@concile/client": "1", "@concile/executor": "1", "@concile/id-codec": "1", "@concile/component": "1" };

  it("I2: --no-install in a fresh folder skips codegen and says how to finish", async () => {
    const root = mkdtempSync(join(tmpdir(), "fw-noinst-"));
    const out: string[] = [];
    let ran = 0;
    const d = deps(root, out);
    d.apply = { ...d.apply, codegen: async () => { ran++; } };
    expect(await initCommand(["--yes", "--no-install", "--starter", "none"], d)).toBe(0);
    expect(ran).toBe(0);
    expect(existsSync(join(root, "concile", "schema.ts"))).toBe(true);
    expect(existsSync(join(root, "concile.config.ts"))).toBe(true);
    const text = out.join("");
    expect(text).toContain("Packages were not installed. Install them, then run: npx concile codegen");
    expect(text).toContain("npm install concile @concile/values");
    expect(text).not.toContain("Next: npx concile dev");
    // A second run does not loop on "run again": nothing left to do, the hint is repeated.
    const out2: string[] = [];
    expect(await initCommand(["--yes", "--no-install", "--starter", "none"], deps(root, out2))).toBe(0);
    expect(out2.join("")).toContain("Already set up");
    expect(out2.join("")).toContain("Packages were not installed");
  });

  it("I3: a starter tells the user one command starts the app and the backend", async () => {
    const tpl = mkdtempSync(join(tmpdir(), "fw-tpl-"));
    for (const t of ["vite", "next"]) { mkdirSync(join(tpl, t)); writeFileSync(join(tpl, t, "package.json"), "{}"); }
    for (const [starter, pm, line] of [
      ["vite", "npm", "npm run dev starts the app and the backend together. Open http://localhost:5173 in two tabs."],
      ["next", "pnpm", "pnpm dev starts the app and the backend together. Open http://localhost:3001 in two tabs."],
    ] as const) {
      const root = mkdtempSync(join(tmpdir(), "fw-start-"));
      const out: string[] = [];
      const d = deps(root, out);
      d.apply = { ...d.apply, templatesDir: tpl };
      expect(await initCommand(["--yes", "--starter", starter, "--pm", pm], d)).toBe(0);
      expect(out.join("")).toContain(line);
    }
  });

  it("I4: an existing Next app is told to run Next on another port", async () => {
    const root = mkdtempSync(join(tmpdir(), "fw-next-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: { next: "15" } }));
    const out: string[] = [];
    expect(await initCommand(["--yes"], deps(root, out))).toBe(0);
    expect(out.join("")).toContain("concile dev uses port 3000. Run Next on another port, e.g. next dev -p 3001.");
  });

  it("I6: a custom functionsDir: add writes nothing under concile/ and codegen targets it", async () => {
    const root = mkdtempSync(join(tmpdir(), "fw-fdir-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: CORE }));
    mkdirSync(join(root, "backend"));
    writeFileSync(join(root, "backend", "schema.ts"), "export default {};\n");
    writeFileSync(join(root, "concile.config.ts"), 'import { defineConfig } from "@concile/component";\nexport default defineConfig({ functionsDir: "backend", components: [] });\n');
    const dirs: string[] = [];
    const d = deps(root, []);
    d.apply = { ...d.apply, codegen: async (dir) => { dirs.push(dir); } };
    expect(await addCommand(["scheduler"], d)).toBe(0);
    expect(existsSync(join(root, "concile"))).toBe(false);
    expect(dirs).toEqual([join(root, "backend")]);
    expect(readFileSync(join(root, "concile.config.ts"), "utf8")).toContain("defineScheduler()");
  });

  it("I8: non-interactive --components on a Concile project only adds, and hints how to remove", async () => {
    const root = mkdtempSync(join(tmpdir(), "fw-add-only-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: CORE }));
    expect(await initCommand(["--components", "auth"], deps(root, []))).toBe(0);
    const out: string[] = [];
    expect(await initCommand(["--components", "scheduler"], deps(root, out))).toBe(0);
    const cfg = readFileSync(join(root, "concile.config.ts"), "utf8");
    expect(cfg).toContain("defineAuth()");
    expect(cfg).toContain("defineScheduler()");
    expect(out.join("")).toContain("To remove components, run npx concile init in a terminal and untick them.");
  });

  it("M3: add rejects unknown flags, honours --pm, and lists what it did", async () => {
    const root = mkdtempSync(join(tmpdir(), "fw-addflags-"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "a", dependencies: CORE }));
    await initCommand(["--components", ""], deps(root, []));
    const bad: string[] = [];
    expect(await addCommand(["scheduler", "--force"], deps(root, bad))).toBe(1);
    expect(bad.join("")).toContain("unknown option: --force");
    const seen: string[] = [];
    const out: string[] = [];
    const d = deps(root, out);
    d.apply = { ...d.apply, install: async (pm) => { seen.push(pm); } };
    expect(await addCommand(["scheduler", "--pm", "pnpm"], d)).toBe(0);
    expect(seen).toEqual(["pnpm"]);
    expect(out.join("")).toMatch(/Done: .*concile\.config.*install.*codegen/);
  });

  it("M9: cli.ts loads the init engine lazily", () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src", "cli.ts"), "utf8");
    expect(src).not.toMatch(/^import .* from "\.\/init\/command";?$/m);
    expect(src).toContain('await import("./init/command")');
  });
});
