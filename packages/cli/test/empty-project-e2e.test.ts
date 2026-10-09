/**
 * Regression for the 2026-10-09 clean-machine failure: a project that has never had `_generated/`
 * written must be able to run `codegen` (and therefore `dev`). The older node-load-e2e test copies
 * a fixture WITH `_generated/` on purpose, which is exactly why this bug went unnoticed.
 * Runs the BUILT CLI (dist/bin.js). Anchored under packages/cli so @concile/* resolve from its
 * node_modules (see node-load-e2e.test.ts for why).
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cliBin = join(here, "..", "dist", "bin.js");
const cliPackageDir = join(here, "..");

const SCHEMA = `import { defineSchema, defineTable, v } from "@concile/values";
export default defineSchema({ messages: defineTable({ author: v.string(), body: v.string() }) });
`;
const MESSAGES = `import { v } from "@concile/values";
import { query, mutation } from "./_generated/server";
export const list = query({ handler: (ctx) => ctx.db.query("messages", "by_creation").collect() });
export const send = mutation({ args: { author: v.string(), body: v.string() }, handler: (ctx, args) => ctx.db.insert("messages", args) });
`;

describe("a brand-new project with no _generated/", () => {
  it("codegen succeeds and writes _generated/ (it used to crash)", () => {
    const tmp = mkdtempSync(join(cliPackageDir, ".tmp-empty-project-"));
    const functionsDir = join(tmp, "concile");
    mkdirSync(functionsDir);
    writeFileSync(join(functionsDir, "schema.ts"), SCHEMA);
    writeFileSync(join(functionsDir, "messages.ts"), MESSAGES);
    try {
      const out = execFileSync(process.execPath, [cliBin, "codegen", "--dir", functionsDir], { encoding: "utf8", stdio: "pipe" });
      expect(out).toContain("generated");
      expect(existsSync(join(functionsDir, "_generated", "api.ts")) || existsSync(join(functionsDir, "_generated", "server.ts"))).toBe(true);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
