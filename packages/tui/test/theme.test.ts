/**
 * FFI-free tests for @concile/tui: the theme is the brand contract (website dark
 * tokens), and importing the package surface must never touch OpenTUI's native
 * renderer (that only happens inside runDashboard()).
 */
import { describe, it, expect } from "vitest";
import { concileTheme } from "../src/lib/terminal-themes/concile";

describe("concile terminal theme", () => {
  it("carries the website dark palette", () => {
    expect(concileTheme.colors.background).toBe("#14110e");
    expect(concileTheme.colors.foreground).toBe("#f2eee9");
    expect(concileTheme.colors.primary).toBe("#e04667"); // the concile crimson
    expect(concileTheme.colors.border).toBe("#332c28");
  });

  it("defines every semantic slot components consume", () => {
    for (const slot of ["success", "warning", "error", "info", "muted", "mutedForeground", "selection", "focusRing"]) {
      expect(concileTheme.colors[slot as keyof typeof concileTheme.colors], slot).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
