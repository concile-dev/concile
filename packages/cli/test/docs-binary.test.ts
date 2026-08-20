/**
 * Guard: the standalone-binary end-user doc must match what `concile build` actually ships
 * (Tasks 1-6 of the single-binary slice) — not a `concile build`/`bunx concile init` fantasy
 * that references packages that don't exist in this monorepo.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("standalone-binary docs match reality", () => {
  // The single-binary content lives in the deploy-and-build page of the fumadocs site.
  const doc = readFileSync(
    join(import.meta.dirname, "../../../website/content/docs/deploy/deploy-and-build.mdx"),
    "utf8",
  );

  it("does not reference non-existent packages", () => {
    for (const phantom of [
      "@concile/runtime-bun",
      "@concile/core",
      "@concile/docstore-bun-sqlite",
      "@concile/blobstore-bun-fs",
    ]) {
      expect(doc).not.toContain(phantom);
    }
  });

  it("documents the real command surface", () => {
    expect(doc).toContain("concile build");
    expect(doc).toContain("--outfile");
    expect(doc).toContain("--target");
    expect(doc).toContain('"ready":true'); // machine-readable startup line
    expect(doc).toContain("CONCILE_ADMIN_KEY");
  });
});
