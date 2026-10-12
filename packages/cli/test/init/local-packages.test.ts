import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pinPackages, useLocalPackages } from "../../src/init/apply";

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "local-pkgs-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "app", overrides: { left: "1" } }));
  const manifest = join(dir, "manifest.json");
  writeFileSync(manifest, JSON.stringify({ concile: "/t/concile.tgz", "@concile/cli": "/t/cli.tgz" }));
  return { dir, manifest };
}

describe("useLocalPackages (CONCILE_LOCAL_PACKAGES, contributors only)", () => {
  it("npm/bun: direct packages become file dependencies, the rest go into overrides", () => {
    const { dir, manifest } = setup();
    expect(useLocalPackages(dir, "npm", ["concile", "react"], manifest)).toEqual(["react"]);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    expect(pkg.dependencies).toEqual({ concile: "file:/t/concile.tgz" });
    // npm rejects an override on a direct dependency, so concile is not overridden.
    expect(pkg.overrides).toEqual({ left: "1", "@concile/cli": "file:/t/cli.tgz" });
  });

  it("pnpm uses pnpm.overrides, yarn uses resolutions", () => {
    const a = setup();
    useLocalPackages(a.dir, "pnpm", [], a.manifest);
    expect(JSON.parse(readFileSync(join(a.dir, "package.json"), "utf8")).pnpm.overrides["@concile/cli"]).toBe("file:/t/cli.tgz");
    const b = setup();
    useLocalPackages(b.dir, "yarn", [], b.manifest);
    expect(JSON.parse(readFileSync(join(b.dir, "package.json"), "utf8")).resolutions["@concile/cli"]).toBe("file:/t/cli.tgz");
  });

  it("pinPackages leaves a package that already names its spec alone", () => {
    expect(pinPackages(["concile@file:/t/c.tgz", "@concile/cli@file:/t/x.tgz", "@concile/auth", "react"], "0.2.1")).toEqual([
      "concile@file:/t/c.tgz", "@concile/cli@file:/t/x.tgz", "@concile/auth@^0.2.1", "react",
    ]);
  });
});
