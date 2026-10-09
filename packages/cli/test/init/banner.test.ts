import { describe, it, expect } from "vitest";
import { bannerFrames, plainBannerLine, showBanner, GREYS } from "../../src/init/banner";

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const final = (o: Parameters<typeof bannerFrames>[0]) => { const f = bannerFrames(o); return f[f.length - 1]!; };

describe("banner", () => {
  it("wide terminals show mark and wordmark side by side, each line within the width", () => {
    const out = strip(final({ columns: 80, level: 3, unicode: true, version: "0.2.0" }));
    expect(out).toContain("██████╗ ██████╗ ███╗");
    expect(out).toContain("the reactive backend you self-host · v0.2.0");
    for (const line of out.split("\n")) expect(line.length).toBeLessThanOrEqual(80);
  });

  it("narrow terminals show the mark and a small name, no wordmark", () => {
    const out = strip(final({ columns: 60, level: 3, unicode: true, version: "0.2.0" }));
    expect(out).not.toContain("███╗");
    expect(out).toContain("concile");
    for (const line of out.split("\n")) expect(line.length).toBeLessThanOrEqual(60);
  });

  it("level 0 output has no escape codes", () => {
    expect(final({ columns: 80, level: 0, unicode: true, version: "0.2.0" })).not.toMatch(/\x1b\[/);
  });

  it("without unicode it falls back to plain text", () => {
    const out = final({ columns: 80, level: 0, unicode: false, version: "0.2.0" });
    expect(out).toMatch(/^[\x00-\x7f]*$/);
    expect(out).toContain("concile");
  });

  it("animation: two frames, the violet cell starts out of place", () => {
    const f = bannerFrames({ columns: 80, level: 3, unicode: true, version: "0.2.0" });
    expect(f.length).toBe(2);
    expect(strip(f[0]!)).not.toBe(strip(f[1]!));
  });

  it("plain line for agents and CI", () => {
    expect(plainBannerLine("0.2.0")).toBe("concile init v0.2.0");
  });

  it("showBanner animated: second write moves up then erases before redrawing", async () => {
    const writes: string[] = [];
    await showBanner({ columns: 60, level: 3, unicode: true, version: "0.2.0" }, (s) => writes.push(s), true);
    expect(writes.length).toBe(2);
    expect(writes[1]).toMatch(/^\x1b\[\d+F\x1b\[J/);
  });

  it("showBanner not animated: writes exactly the final frame once", async () => {
    const o = { columns: 80, level: 3 as const, unicode: true, version: "0.2.0" };
    const writes: string[] = [];
    await showBanner(o, (s) => writes.push(s), false);
    expect(writes).toEqual([final(o) + "\n"]);
  });
  it("wordmark greys read on light and dark backgrounds (no near-white, no near-black)", () => {
    for (const g of GREYS) {
      expect(g).toBeGreaterThanOrEqual(90);
      expect(g).toBeLessThanOrEqual(180);
    }
    const out = final({ columns: 80, level: 2, unicode: true, version: "0.2.0" });
    const codes = [...out.matchAll(/\x1b\[38;5;(\d+)m/g)].map((m) => Number(m[1]));
    const cube = [0, 95, 135, 175, 215, 255];
    const greys = codes.filter((c) => c >= 16 && c <= 231).map((c) => { const n = c - 16; return [cube[Math.floor(n / 36)]!, cube[Math.floor(n / 6) % 6]!, cube[n % 6]!]; }).filter(([r, g, b]) => r === g && g === b);
    expect(greys.length).toBeGreaterThanOrEqual(6);
    for (const [v] of greys) expect(v).toBeLessThanOrEqual(175);
  });
});
