import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { detect, compareVersions, packageNameFor } from "../../src/init/detect";

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "detect-"));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  return root;
}
const pkg = (deps: Record<string, string> = {}, extra: object = {}) => JSON.stringify({ name: "x", dependencies: deps, ...extra });

describe("detect", () => {
  it("empty folder (ignores .git and .DS_Store)", () => {
    const r = project({ ".DS_Store": "", ".git/HEAD": "ref" });
    expect(detect(r).kind).toBe("empty");
  });
  it("files but no package.json is 'loose'", () => {
    expect(detect(project({ "notes.txt": "hi" })).kind).toBe("loose");
  });
  it("Next.js wins over vite in devDependencies", () => {
    const r = project({ "package.json": pkg({ next: "15" }, { devDependencies: { vite: "6" } }), "tsconfig.json": "{}" });
    const i = detect(r);
    expect([i.kind, i.framework, i.typescript]).toEqual(["frontend", "next", true]);
  });
  it("Vite app", () => expect(detect(project({ "package.json": pkg({}, { devDependencies: { vite: "6" } }) })).framework).toBe("vite"));
  it("plain Node project", () => {
    const i = detect(project({ "package.json": pkg({ express: "5" }) }));
    expect([i.kind, i.framework]).toEqual(["node", "node"]);
  });
  it("Convex project", () => expect(detect(project({ "package.json": pkg({ convex: "1" }), "convex/schema.ts": "" })).kind).toBe("convex"));
  it("existing Concile project lists its components", () => {
    const i = detect(project({
      "package.json": pkg({ concile: "0.2.0" }),
      "concile/schema.ts": "",
      "concile.config.ts": 'import { defineAuth } from "@concile/auth";\nimport { defineScheduler } from "@concile/scheduler";',
    }));
    expect(i.kind).toBe("concile");
    expect(i.existingComponents).toEqual(["auth", "scheduler"]);
  });
  it("monorepo root lists apps", () => {
    const i = detect(project({
      "package.json": pkg({}, { workspaces: ["apps/*"] }),
      "apps/web/package.json": pkg({ next: "15" }),
      "apps/api/package.json": pkg({}),
    }));
    expect(i.kind).toBe("monorepo");
    expect(i.workspaceApps.sort()).toEqual(["apps/api", "apps/web"]);
  });
  it("package manager: lockfile, then packageManager field, then user agent, then npm", () => {
    const r = project({ "package.json": pkg(), "pnpm-lock.yaml": "" });
    expect(detect(r, { npm_config_user_agent: "bun/1.3.0" }).packageManager).toBe("pnpm");
    expect(detect(project({ "package.json": pkg() }), { npm_config_user_agent: "bun/1.3.0" }).packageManager).toBe("bun");
    expect(detect(project({ "package.json": pkg({}, { packageManager: "yarn@4.0.0" }) }), {}).packageManager).toBe("yarn");
    expect(detect(project({ "package.json": pkg() }), {}).packageManager).toBe("npm");
  });
  it("gitDirty is false when clean, true with an untracked file", () => {
    const r = project({ "a.txt": "a" });
    const git = (...args: string[]) => spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...args], { cwd: r });
    git("init");
    git("add", ".");
    git("commit", "-m", "init");
    expect(detect(r, {}).gitDirty).toBe(false);
    writeFileSync(join(r, "b.txt"), "b");
    expect(detect(r, {}).gitDirty).toBe(true);
  });
  it("node version check", () => {
    expect(detect(project({}), {}, "20.11.0").nodeOk).toBe(false);
    expect(detect(project({}), {}, "22.17.0").nodeOk).toBe(false);
    expect(detect(project({}), {}, "22.18.0").nodeOk).toBe(true);
    expect(detect(project({}), {}, "24.0.0-nightly20250101").nodeOk).toBe(true);
    expect(compareVersions("24.1.0", "22.5.0")).toBeGreaterThan(0);
  });
  it("a fresh GitHub clone (README, LICENSE, .gitignore, .gitattributes) counts as empty", () => {
    const r = project({ "README.md": "# x", "LICENSE": "MIT", ".gitignore": "node_modules\n", ".gitattributes": "* text=auto\n" });
    expect(detect(r, {}).kind).toBe("empty");
    expect(detect(project({ "README.md": "# x", "notes.txt": "hi" }), {}).kind).toBe("loose");
  });
  it("monorepo app: the package manager comes from the workspace root", () => {
    const r = project({
      "package.json": pkg({}, { private: true }),
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      "pnpm-lock.yaml": "",
      "apps/web/package.json": pkg({ next: "15" }),
    });
    expect(detect(join(r, "apps", "web"), { npm_config_user_agent: "npm/10.0.0" }).packageManager).toBe("pnpm");
  });
  it("the upward search stops at a .git folder", () => {
    const r = project({ "pnpm-lock.yaml": "", "repo/.git/HEAD": "ref", "repo/package.json": pkg() });
    expect(detect(join(r, "repo"), {}).packageManager).toBe("npm");
  });
  it("hasFunctionsDir follows a custom functions directory", () => {
    const r = project({ "package.json": pkg(), "backend/schema.ts": "" });
    expect(detect(r, {}).hasFunctionsDir).toBe(false);
    const i = detect(r, {}, undefined, "backend");
    expect([i.hasFunctionsDir, i.functionsDir]).toEqual([true, "backend"]);
  });
});

describe("packageNameFor", () => {
  it("makes a valid npm name from a folder name", () => {
    expect(packageNameFor("My App")).toBe("my-app");
    expect(packageNameFor("_.Hidden Thing!")).toBe("hidden-thing");
    expect(packageNameFor("ok-name")).toBe("ok-name");
    expect(packageNameFor("...")).toBe("my-app");
  });
});
