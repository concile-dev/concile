import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const tpl = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates");
const pkgJson = JSON.parse(readFileSync(join(tpl, "..", "package.json"), "utf8"));

describe("templates", () => {
  it("ship in the npm package", () => expect(pkgJson.files).toContain("templates"));
  for (const t of ["vite", "next"]) {
    it(`${t}: has package.json and _gitignore (not .gitignore), no concile/ folder`, () => {
      expect(existsSync(join(tpl, t, "package.json"))).toBe(true);
      expect(existsSync(join(tpl, t, "_gitignore"))).toBe(true);
      expect(existsSync(join(tpl, t, ".gitignore"))).toBe(false);
      expect(existsSync(join(tpl, t, "concile"))).toBe(false);
    });
  }
  it("vite reads VITE_CONCILE_URL; next reads NEXT_PUBLIC_CONCILE_URL", () => {
    expect(readFileSync(join(tpl, "vite", "src", "main.tsx"), "utf8")).toContain("import.meta.env.VITE_CONCILE_URL");
    expect(readFileSync(join(tpl, "next", "app", "providers.tsx"), "utf8")).toContain("process.env.NEXT_PUBLIC_CONCILE_URL");
  });
  it("next creates the client lazily, never at module scope", () => {
    const src = readFileSync(join(tpl, "next", "app", "providers.tsx"), "utf8");
    const lines = src.split("\n").filter((l) => l.includes("new ConcileClient("));
    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^\s+/);
  });
  it("starters use a per-tab author, not a fixed one", () => {
    for (const f of [["vite", "src", "App.tsx"], ["next", "app", "page.tsx"]]) {
      expect(readFileSync(join(tpl, ...f), "utf8")).not.toContain('author: "you"');
    }
  });
  it("vite tsconfig is noEmit", () => {
    expect(JSON.parse(readFileSync(join(tpl, "vite", "tsconfig.json"), "utf8")).compilerOptions.noEmit).toBe(true);
  });
  it("next closes the client in the effect cleanup", () => {
    const src = readFileSync(join(tpl, "next", "app", "providers.tsx"), "utf8");
    expect(src).toMatch(/return \(\) => \{[^}]*\.close\(\)/);
  });
  it("next runs on port 3001 (concile dev owns 3000) and is an ES module package", () => {
    const pj = JSON.parse(readFileSync(join(tpl, "next", "package.json"), "utf8"));
    expect(pj.scripts.dev).toBe("next dev -p 3001");
    expect(pj.type).toBe("module");
  });
});
