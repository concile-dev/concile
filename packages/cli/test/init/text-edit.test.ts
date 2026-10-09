import { describe, it, expect } from "vitest";
import { gitignoreNegates, envHasKey, mergeEnv, gitignoreCovers, mergeGitignore, upsertBlock, hasBlock } from "../../src/init/text-edit";

describe("env", () => {
  it("never overwrites an existing key", () => {
    const out = mergeEnv("VITE_CONCILE_URL=ws://elsewhere\n", [{ key: "VITE_CONCILE_URL", value: "ws://127.0.0.1:3000/api/sync" }]);
    expect(out).toBe("VITE_CONCILE_URL=ws://elsewhere\n");
  });
  it("appends on a fresh line when the file has no trailing newline", () => {
    expect(mergeEnv("A=1", [{ key: "B", value: "2" }])).toBe("A=1\nB=2\n");
  });
  it("keeps CRLF files CRLF", () => {
    expect(mergeEnv("A=1\r\n", [{ key: "B", value: "2", comment: "why" }])).toBe("A=1\r\n# why\r\nB=2\r\n");
  });
  it("recognises export and spaces", () => {
    expect(envHasKey("export  A = 1\n", "A")).toBe(true);
    expect(envHasKey("# A=1\n", "A")).toBe(false);
  });
});

describe("gitignore", () => {
  it("treats .concile and patterns as covering", () => {
    expect(gitignoreCovers(".concile\n", ".concile/")).toBe(true);
    expect(gitignoreCovers(".env*\n", ".env.local")).toBe(true);
    expect(gitignoreCovers("*.local\n", ".env.local")).toBe(true);
    expect(gitignoreCovers("node_modules\n", ".env.local")).toBe(false);
  });
  it("adds only missing entries under a comment", () => {
    expect(mergeGitignore("node_modules\n.env*\n", [".concile/", ".env.local"])).toBe("node_modules\n.env*\n\n# concile\n.concile/\n");
    expect(mergeGitignore(".concile/\n.env.local\n", [".concile/", ".env.local"])).toBe(".concile/\n.env.local\n");
  });
});

describe("marked block", () => {
  it("appends, then replaces only the block on re-run", () => {
    const once = upsertBlock("# My agents\n", "v1");
    expect(once).toBe("# My agents\n\n<!-- concile:start -->\nv1\n<!-- concile:end -->\n");
    const twice = upsertBlock(once + "\nmore\n", "v2");
    expect(twice).toBe("# My agents\n\n<!-- concile:start -->\nv2\n<!-- concile:end -->\n\nmore\n");
    expect(hasBlock(twice, "v2")).toBe(true);
    expect(hasBlock(twice, "v1")).toBe(false);
  });
  it("is stable and detectable on CRLF files", () => {
    const once = upsertBlock("# My agents\r\n", "a\nb");
    expect(hasBlock(once, "a\nb")).toBe(true);
    expect(upsertBlock(once, "a\nb")).toBe(once);
    expect(once).not.toMatch(/[^\r]\n/);
    // a block an editor converted to CRLF is still seen
    expect(hasBlock("x\r\n<!-- concile:start -->\r\nv1\r\n<!-- concile:end -->\r\n", "v1")).toBe(true);
  });
  it("leaves malformed markers untouched", () => {
    const orphan = "# a\n<!-- concile:start -->\nuser text\n";
    expect(upsertBlock(orphan, "v")).toBe(orphan);
    const reversed = "<!-- concile:end -->\nmid\n<!-- concile:start -->\n";
    expect(upsertBlock(reversed, "v")).toBe(reversed);
    const dup = "<!-- concile:start -->\na\n<!-- concile:end -->\n<!-- concile:start -->\nb\n<!-- concile:end -->\n";
    expect(upsertBlock(dup, "v")).toBe(dup);
    const onlyEnd = "x\n<!-- concile:end -->\n";
    expect(upsertBlock(onlyEnd, "v")).toBe(onlyEnd);
  });
  it("is idempotent on a clean file", () => {
    const once = upsertBlock("# x\n", "v");
    expect(upsertBlock(once, "v")).toBe(once);
  });
});

describe("gitignore negation", () => {
  it("last match wins", () => {
    expect(gitignoreCovers(".env*\n", ".env.local")).toBe(true);
    expect(gitignoreCovers(".env*\n!.env.local\n", ".env.local")).toBe(false);
    expect(gitignoreCovers("!.env.local\n", ".env.local")).toBe(false);
    expect(gitignoreCovers("!.env.local\n.env*\n", ".env.local")).toBe(true);
  });
  it("does not append an explicitly re-included entry", () => {
    expect(mergeGitignore(".env*\n!.env.local\n", [".env.local"])).toBe(".env*\n!.env.local\n");
    expect(mergeGitignore("!.env.local\n", [".env.local"])).toBe("!.env.local\n");
  });
  it("gitignoreNegates reports explicit re-includes", () => {
    expect(gitignoreNegates(".env*\n!.env.local\n", ".env.local")).toBe(true);
    expect(gitignoreNegates(".env*\n", ".env.local")).toBe(false);
  });
  it("keeps CRLF gitignore CRLF", () => {
    expect(mergeGitignore("a\r\n", [".concile/"])).toBe("a\r\n\r\n# concile\r\n.concile/\r\n");
  });
});
