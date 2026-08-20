import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveCli, buildDevArgs } from "../src/resolve-cli";

describe("resolveCli", () => {
  const dirs: string[] = [];
  afterEach(() => { dirs.forEach((d) => rmSync(d, { recursive: true, force: true })); dirs.length = 0; });

  it("splits an explicit override into command + baseArgs", () => {
    expect(resolveCli("/x", "bun run concile")).toEqual({ command: "bun", baseArgs: ["run", "concile"] });
    expect(resolveCli("/x", "concile")).toEqual({ command: "concile", baseArgs: [] });
  });

  it("uses node_modules/.bin/concile when present", () => {
    const dir = mkdtempSync(join(tmpdir(), "sb-cli-")); dirs.push(dir);
    mkdirSync(join(dir, "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(dir, "node_modules", ".bin", "concile"), "#!/bin/sh\n");
    expect(resolveCli(dir)).toEqual({ command: join(dir, "node_modules", ".bin", "concile"), baseArgs: [] });
  });

  it("falls back to `npx concile` when there is no local bin", () => {
    const dir = mkdtempSync(join(tmpdir(), "sb-cli-")); dirs.push(dir);
    expect(resolveCli(dir)).toEqual({ command: "npx", baseArgs: ["concile"] });
  });
});

describe("buildDevArgs", () => {
  it("assembles the dev argv with port, dir, and forwarded extras", () => {
    expect(buildDevArgs([], 3210, "convex", [])).toEqual(["dev", "--port", "3210", "--dir", "convex"]);
    expect(buildDevArgs(["concile"], 4000, "backend", ["--database-url", "pg://x"])).toEqual([
      "concile", "dev", "--port", "4000", "--dir", "backend", "--database-url", "pg://x",
    ]);
  });
});
