import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureGeneratedStub } from "../src/generated-stub";

function fnDir(): string {
  const d = join(mkdtempSync(join(tmpdir(), "stub-")), "concile");
  mkdirSync(d, { recursive: true });
  return d;
}

describe("ensureGeneratedStub", () => {
  it("writes _generated/server.ts when it is missing", () => {
    const dir = fnDir();
    expect(ensureGeneratedStub(dir, [])).toBe(true);
    const file = join(dir, "_generated", "server.ts");
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, "utf8")).toContain("@concile/executor");
  });

  it("leaves an existing _generated/server.ts untouched", () => {
    const dir = fnDir();
    mkdirSync(join(dir, "_generated"));
    writeFileSync(join(dir, "_generated", "server.ts"), "// real\n");
    expect(ensureGeneratedStub(dir, [])).toBe(false);
    expect(readFileSync(join(dir, "_generated", "server.ts"), "utf8")).toBe("// real\n");
  });
});
