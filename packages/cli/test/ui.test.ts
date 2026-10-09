/**
 * The styling module's core contract: when output is not an interactive terminal
 * (which is exactly how this test runs — vitest pipes stdout), every helper is a
 * plain-text passthrough with zero ANSI escapes. Piped/CI/e2e output must stay
 * byte-identical to the pre-styling CLI.
 */
import { describe, it, expect } from "vitest";
import * as ui from "../src/ui";

// eslint-disable-next-line no-control-regex
const ANSI = /\[/;

describe("ui — plain-mode passthrough", () => {
  it("detects non-TTY and disables styling", () => {
    expect(ui.styled).toBe(false);
  });

  it("color helpers are identity functions when unstyled", () => {
    for (const fn of [ui.bold, ui.dim, ui.red, ui.green, ui.yellow, ui.blue, ui.magenta, ui.cyan, ui.brand]) {
      expect(fn("hello")).toBe("hello");
    }
  });

  it("symbols carry no escape codes", () => {
    for (const s of Object.values(ui.sym)) expect(s).not.toMatch(ANSI);
  });

  it("keyValues aligns keys and stays escape-free", () => {
    const out = ui.keyValues([
      ["API", "http://x"],
      ["Dashboard", "http://x/_dashboard"],
    ]);
    expect(out).not.toMatch(ANSI);
    const lines = out.split("\n");
    // values start at the same column
    const cols = lines.map((l) => l.indexOf("http://"));
    expect(new Set(cols).size).toBe(1);
  });

  it("status and errorBlock render plain, actionable text", () => {
    expect(ui.status("ok", "12 functions", "0.3s")).toBe("  ✓ 12 functions   0.3s");
    const block = ui.errorBlock("reload failed", "SyntaxError: oops\nat messages.ts:3", "fix the file");
    expect(block).not.toMatch(ANSI);
    expect(block).toContain("✗ reload failed");
    expect(block).toContain("    at messages.ts:3");
    expect(block).toContain("→ fix the file");
  });
});

import { detectColorLevel, supportsUnicode, rgb, BRAND_RGB } from "../src/ui";

const base = { env: {} as Record<string, string | undefined>, isTTY: true, platform: "darwin" };

describe("ui: colour levels", () => {
  it("is 0 when not a TTY, NO_COLOR, TERM=dumb or CONCILE_PLAIN", () => {
    expect(detectColorLevel({ ...base, isTTY: false })).toBe(0);
    expect(detectColorLevel({ ...base, env: { NO_COLOR: "" } })).toBe(0);
    expect(detectColorLevel({ ...base, env: { TERM: "dumb" } })).toBe(0);
    expect(detectColorLevel({ ...base, env: { CONCILE_PLAIN: "1" } })).toBe(0);
  });

  it("detects truecolor, 256 and 16", () => {
    expect(detectColorLevel({ ...base, env: { COLORTERM: "truecolor" } })).toBe(3);
    expect(detectColorLevel({ ...base, env: { TERM: "xterm-256color" } })).toBe(2);
    expect(detectColorLevel({ ...base, env: { TERM: "xterm" } })).toBe(1);
  });

  it("FORCE_COLOR only for the installer", () => {
    const piped = { ...base, isTTY: false, env: { FORCE_COLOR: "3" } };
    expect(detectColorLevel(piped)).toBe(0); // dev/serve/codegen output stays plain
    expect(detectColorLevel(piped, { honorForce: true })).toBe(3);
    expect(detectColorLevel({ ...piped, env: { FORCE_COLOR: "0" } }, { honorForce: true })).toBe(0);
  });

  it("rgb degrades per level", () => {
    const [r, g, b] = BRAND_RGB;
    expect(rgb(3, r, g, b)("x")).toBe("\x1b[38;2;139;108;240mx\x1b[39m");
    expect(rgb(2, r, g, b)("x")).toMatch(/^\x1b\[38;5;\d+mx\x1b\[39m$/);
    expect(rgb(1, r, g, b)("x")).toBe("\x1b[35mx\x1b[39m");
    expect(rgb(0, r, g, b)("x")).toBe("x");
  });

  it("unicode off on legacy Windows consoles and with CONCILE_ASCII", () => {
    expect(supportsUnicode(base)).toBe(true);
    expect(supportsUnicode({ ...base, platform: "win32" })).toBe(false);
    expect(supportsUnicode({ ...base, platform: "win32", env: { WT_SESSION: "1" } })).toBe(true);
    expect(supportsUnicode({ ...base, env: { CONCILE_ASCII: "1" } })).toBe(false);
  });
});
