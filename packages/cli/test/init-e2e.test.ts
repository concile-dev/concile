/**
 * The test that would have caught the 2026-10-09 failure: run the BUILT `concile init --yes`
 * into a fresh folder, then boot it and prove a mutation writes and a query reads it back. Live push is covered by admin-browse-e2e.test.ts. `--no-install`
 * because this monorepo resolves @concile/* from packages/cli/node_modules (folder is anchored
 * there, see node-load-e2e.test.ts); the real-npm path is covered by scripts/clean-machine-test.sh.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bootProject } from "../src/boot";

const here = dirname(fileURLToPath(import.meta.url));
const cliBin = join(here, "..", "dist", "bin.js");
const cliPackageDir = join(here, "..");

/**
 * The tmp project's package.json does not list @concile/* (they resolve from packages/cli/node_modules),
 * so init with --no-install skips codegen and says to install, then run codegen. That is what this does.
 */
function initInto(extra: string[]): string {
  const root = mkdtempSync(join(cliPackageDir, ".tmp-init-e2e-"));
  try {
    const out = execFileSync(process.execPath, [cliBin, "init", "--yes", "--no-install", ...extra], { cwd: root, encoding: "utf8", stdio: "pipe", input: "", env: { ...process.env, CI: "1" } });
    expect(out).toContain("Packages were not installed. Install them, then run: npx concile codegen");
    execFileSync(process.execPath, [cliBin, "codegen", "--dir", join(root, "concile")], { cwd: root, encoding: "utf8", stdio: "pipe", input: "", env: { ...process.env, CI: "1" } });
  } catch (e) {
    rmSync(root, { recursive: true, force: true });
    throw e;
  }
  return root;
}

describe("concile init end to end", () => {
  it("backend only: init, generated types, boot, live update", async () => {
    const root = initInto(["--starter", "none", "--components", "scheduler"]);
    try {
      expect(existsSync(join(root, "concile", "_generated", "server.ts"))).toBe(true);
      expect(readFileSync(join(root, ".env.local"), "utf8")).toContain("CONCILE_URL=ws://127.0.0.1:3000/api/sync");
      const { runtime } = await bootProject({ functionsDir: join(root, "concile"), dataPath: join(root, ".concile", "data.db"), adminKey: "k" });
      try {
        await runtime.run("messages:send", { author: "a", body: "hello" });
        const list = await runtime.run<Array<{ body: string }>>("messages:list", {});
        expect(list.value.map((m) => m.body)).toEqual(["hello"]);
      } finally {
        await runtime.stopDrivers();
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 120000);

  it("second run changes nothing", () => {
    const root = initInto(["--starter", "none"]);
    try {
      const out = execFileSync(process.execPath, [cliBin, "init", "--yes", "--no-install", "--starter", "none"], { cwd: root, encoding: "utf8", stdio: "pipe", input: "", env: { ...process.env, CI: "1" } });
      expect(out).toContain("Already set up");
      expect(out).toContain("Packages were not installed");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 120000);

  it("closed stdin never hangs", () => {
    const root = mkdtempSync(join(cliPackageDir, ".tmp-init-e2e-"));
    try {
      const started = Date.now();
      execFileSync(process.execPath, [cliBin, "init", "--no-install", "--starter", "none"], { cwd: root, stdio: ["ignore", "pipe", "pipe"], timeout: 20000 });
      expect(Date.now() - started).toBeLessThan(20000);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30000);
});
