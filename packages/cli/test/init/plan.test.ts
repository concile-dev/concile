// packages/cli/test/init/plan.test.ts
import { describe, it, expect } from "vitest";
import { planInit, previewLines, type FsView, type Answers } from "../../src/init/plan";
import type { ProjectInfo } from "../../src/init/detect";
import { SYNC_URL } from "../../src/init/registry";

const info = (over: Partial<ProjectInfo>): ProjectInfo => ({
  root: "/x", kind: "frontend", framework: "next", packageManager: "npm", typescript: true, gitDirty: false,
  nodeVersion: "24.0.0", nodeOk: true, existingComponents: [], workspaceApps: [], hasFunctionsDir: false,
  hasConfig: false, installedPackages: [], functionsDir: "concile", ...over,
});
const view = (files: Record<string, string>): FsView => ({ read: (p) => files[p] ?? null, exists: (p) => p in files || Object.keys(files).some((f) => f.startsWith(p + "/")) });
const answers: Answers = { starter: null, components: ["auth"], db: "sqlite", databaseUrl: null };

describe("planInit", () => {
  it("existing Next app: sample files, config, env with prefix, gitignore, agents, install, codegen", () => {
    const kinds = planInit(info({}), answers, view({ "package.json": "{}" }));
    expect(kinds.map((a) => a.kind)).toEqual(["writeFile", "writeFile", "writeFile", "env", "gitignore", "agents", "install", "codegen"]);
    const env = kinds.find((a) => a.kind === "env")!;
    expect(env).toMatchObject({ keys: [{ key: "NEXT_PUBLIC_CONCILE_URL", value: SYNC_URL }] });
    const install = kinds.find((a) => a.kind === "install")!;
    expect(install).toMatchObject({ full: false });
    expect((install as { packages: string[] }).packages).toEqual(expect.arrayContaining(["concile", "@concile/executor", "@concile/auth"]));
  });

  it("empty folder with vite starter copies the template and runs a full install", () => {
    const acts = planInit(info({ kind: "empty", framework: null }), { ...answers, starter: "vite" }, view({}));
    expect(acts[0]).toMatchObject({ kind: "copyTemplate", template: "vite" });
    expect(acts.find((a) => a.kind === "install")).toMatchObject({ full: true });
    expect(acts.find((a) => a.kind === "env")).toMatchObject({ keys: [{ key: "VITE_CONCILE_URL" }] });
  });

  it("is idempotent: a fully set-up project plans nothing", async () => {
    const done = view({
      "package.json": "{}",
      "concile/schema.ts": "x", "concile/_generated/api.d.ts": "x",
      "concile.config.ts": 'import { defineAuth } from "@concile/auth";',
      ".env.local": `NEXT_PUBLIC_CONCILE_URL=${SYNC_URL}\n`,
      ".gitignore": ".concile/\n.env.local\n",
      "AGENTS.md": "<!-- concile:start -->\n" + (await import("../../src/init/registry")).AGENTS_BLOCK + "\n<!-- concile:end -->\n",
    });
    const acts = planInit(info({ kind: "concile", hasFunctionsDir: true, hasConfig: true, existingComponents: ["auth"],
      installedPackages: ["concile", "@concile/values", "@concile/client", "@concile/executor", "@concile/id-codec", "@concile/component", "@concile/auth"] }), answers, done);
    expect(acts).toEqual([]);
  });

  it("unticking a component plans a config removal but no uninstall", () => {
    const acts = planInit(info({ kind: "concile", hasFunctionsDir: true, hasConfig: true, existingComponents: ["auth", "scheduler"] }),
      { ...answers, components: ["auth"] }, view({ "concile/_generated/api.d.ts": "x", "concile.config.ts": "" }));
    expect(acts.find((a) => a.kind === "config")).toMatchObject({ add: [], remove: ["scheduler"] });
  });

  it("postgres adds CONCILE_DATABASE_URL (empty when 'later')", () => {
    const acts = planInit(info({}), { ...answers, db: "postgres", databaseUrl: null }, view({}));
    const env = acts.find((a) => a.kind === "env") as { keys: { key: string; value: string }[] };
    expect(env.keys.find((k) => k.key === "CONCILE_DATABASE_URL")!.value).toBe("");
  });

  it("preview marks new files + and edits ~", () => {
    const fs = view({ ".gitignore": "node_modules\n" });
    const lines = previewLines(planInit(info({}), answers, fs), info({}), fs);
    expect(lines.find((l) => l.path === "concile/schema.ts")!.mark).toBe("+");
    expect(lines.find((l) => l.path === ".gitignore")!.mark).toBe("~");
  });

  it("does not plan a gitignore entry the user re-included with '!'", () => {
    const acts = planInit(info({}), answers, view({ ".gitignore": ".concile/\n!.env.local\n" }));
    expect(acts.find((a) => a.kind === "gitignore")).toBeUndefined();
  });
  it("names the package after the folder, sanitized", () => {
    const acts = planInit(info({ root: "/x/My App", kind: "empty", framework: null }), { ...answers, starter: "none" }, view({}));
    const pj = acts.find((a) => a.kind === "writeFile" && a.path === "package.json") as { content: string };
    expect(JSON.parse(pj.content).name).toBe("my-app");
    const starter = planInit(info({ root: "/x/My App", kind: "empty", framework: null }), { ...answers, starter: "vite" }, view({}));
    expect(starter[0]).toMatchObject({ kind: "copyTemplate", name: "my-app" });
  });

  it("a custom functionsDir: samples and codegen use it, never concile/", () => {
    const fresh = planInit(info({ functionsDir: "backend" }), answers, view({}));
    expect(fresh.filter((a) => a.kind === "writeFile").map((a) => (a as { path: string }).path)).toContain("backend/schema.ts");
    const existing = planInit(
      info({ kind: "concile", functionsDir: "backend", hasFunctionsDir: true, hasConfig: true }),
      answers,
      view({ "backend/schema.ts": "x", "backend/_generated/api.d.ts": "x", "concile.config.ts": "" }),
    );
    expect(existing.some((a) => a.kind === "writeFile" && a.path.includes("schema.ts"))).toBe(false);
  });

  it("an existing Concile project with a config never gets sample files", () => {
    const acts = planInit(info({ kind: "concile", hasConfig: true }), answers, view({ "concile.config.ts": "" }));
    expect(acts.some((a) => a.kind === "writeFile")).toBe(false);
  });
});
