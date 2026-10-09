import { describe, it, expect, vi } from "vitest";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultApplyDeps } from "../../src/init/apply";

const here = dirname(fileURLToPath(import.meta.url));
const cliPackageDir = join(here, "..", ".."); // packages/cli/test/init -> packages/cli
const fixtureSrc = join(here, "..", "fixtures", "conventional-app", "concile");

describe("defaultApplyDeps().codegen", () => {
  // `init --json` must print exactly one JSON document, so the codegen it runs must not
  // print `generated ...`. The temp dir sits under packages/cli so @concile/* resolve from
  // this package's node_modules (see test/node-load-e2e.test.ts for why).
  it("generates types without writing to stdout", async () => {
    const tmp = mkdtempSync(join(cliPackageDir, ".tmp-init-codegen-"));
    const functionsDir = join(tmp, "concile");
    cpSync(fixtureSrc, functionsDir, { recursive: true });
    const spy = vi.spyOn(process.stdout, "write");
    try {
      await defaultApplyDeps().codegen(functionsDir);
      const printed = spy.mock.calls.map((c) => String(c[0])).join("");
      expect(printed).not.toContain("generated");
      expect(existsSync(join(functionsDir, "_generated", "server.ts"))).toBe(true);
    } finally {
      spy.mockRestore();
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 60_000);
});
