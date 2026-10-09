import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnvFiles, parseEnv } from "../src/env-files";

describe("loadEnvFiles (concile dev reads .env.local, then .env)", () => {
  it("sets a key from .env.local when the environment does not have it", () => {
    const root = mkdtempSync(join(tmpdir(), "envf-"));
    writeFileSync(join(root, ".env.local"), "# Postgres\nCONCILE_DATABASE_URL=x\n");
    const env: Record<string, string | undefined> = {};
    loadEnvFiles(root, env);
    expect(env.CONCILE_DATABASE_URL).toBe("x");
  });
  it("a value already in the environment wins; .env.local wins over .env", () => {
    const root = mkdtempSync(join(tmpdir(), "envf2-"));
    writeFileSync(join(root, ".env.local"), "A=local\nB=local\n");
    writeFileSync(join(root, ".env"), "A=env\nB=env\nC=env\n");
    const env: Record<string, string | undefined> = { A: "shell" };
    loadEnvFiles(root, env);
    expect(env).toEqual({ A: "shell", B: "local", C: "env" });
  });
  it("no files is fine", () => {
    const env: Record<string, string | undefined> = {};
    loadEnvFiles(mkdtempSync(join(tmpdir(), "envf3-")), env);
    expect(env).toEqual({});
  });
  it("parses export, quotes, CRLF and comments; skips empty values", () => {
    expect(parseEnv('export A="x y"\r\nB=\'q\'\r\n# c\r\nC=\r\nD=plain # note\r\nE="has # hash"\n')).toEqual({ A: "x y", B: "q", D: "plain", E: "has # hash" });
  });
});
