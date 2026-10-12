import { describe, it, expect } from "vitest";
import { bannerFrames, plainBannerLine, showBanner, WIDE, BOXED } from "../../src/init/banner";

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const final = (o: Parameters<typeof bannerFrames>[0]) => { const f = bannerFrames(o); return f[f.length - 1]!; };
const VIOLET = "\x1b[38;2;139;108;240m";

describe("banner", () => {
  it("wide terminals: one box from column 0, wordmark | the essentials", () => {
    const out = strip(final({ columns: 100, level: 3, unicode: true, version: "0.2.0" }));
    const lines = out.split("\n").filter(Boolean);
    expect(lines).toHaveLength(8); // borders, a padding row above and below, 4 wordmark rows
    // Column 0, where the prompts' vertical bar is.
    expect(lines[0]).toMatch(/^╭─+┬─+╮$/);
    expect(lines.at(-1)).toMatch(/^╰─+┴─+╯$/);
    expect(lines[1]).toMatch(/^│ +│ +│$/);
    expect(lines[2]).toContain("│  concile init v0.2.0");
    expect(lines[3]).toContain("│  ▄▀▀▀ ▄▀▀▄ █▀▀▄ ▄▀▀▀ █ █ ▄▀▀▄  │  the reactive backend you self-host");
    expect(lines[4]).toContain("docs concile.dev/docs");
    expect(lines[5]).toContain("nothing changes until you say yes");
    // A clean grid: every line the same width, the separator in the same column.
    expect(new Set(lines.map((l) => l.length)).size).toBe(1);
    const sep = lines[0]!.indexOf("┬");
    expect(lines.at(-1)!.indexOf("┴")).toBe(sep);
    for (const l of lines.slice(1, -1)) expect(l[sep]).toBe("│");
    expect(lines[0]!.length).toBe(BOXED);
    expect(BOXED).toBeLessThanOrEqual(80);
  });

  it("medium terminals: the wordmark alone, 4 lines tall, version on the tagline", () => {
    const out = strip(final({ columns: 60, level: 3, unicode: true, version: "0.2.0" }));
    expect(out).not.toContain("╭");
    expect(out.split("\n").slice(1, 5)[2]).toBe("  █    █  █ █  █ █    █ █ █▀▀▀");
    expect(out).toContain("the reactive backend you self-host · v0.2.0");
    expect(WIDE).toBe(30); // was 75 columns with the mark and block letters
  });

  it("the one violet cell is the dot of the i", () => {
    const out = final({ columns: 80, level: 3, unicode: true, version: "0.2.0" });
    expect(out.split(VIOLET).length - 1).toBe(1);
    expect(out).toContain(`${VIOLET}▀`);
  });

  it("plain cells use the terminal's own colour, so it reads on dark and light themes", () => {
    const out = final({ columns: 80, level: 3, unicode: true, version: "0.2.0" });
    const colours = [...out.matchAll(/\x1b\[38;[^m]*m/g)].map((m) => m[0]);
    expect(new Set(colours)).toEqual(new Set([VIOLET]));
  });

  it("terminals narrower than the wordmark get the name as text, without animation", () => {
    const o = { columns: 25, level: 3 as const, unicode: true, version: "0.2.0" };
    const out = strip(final(o));
    expect(out).not.toContain("█");
    expect(out).toContain("concile");
    expect(bannerFrames(o)).toHaveLength(1);
  });

  it("level 0 output has no escape codes", () => {
    expect(final({ columns: 80, level: 0, unicode: true, version: "0.2.0" })).not.toMatch(/\x1b\[/);
  });

  it("without unicode it falls back to plain text", () => {
    const out = final({ columns: 80, level: 0, unicode: false, version: "0.2.0" });
    expect(out).toMatch(/^[\x00-\x7f]*$/);
    expect(out).toContain("concile");
  });

  it("animation: the i's violet dot drops in; nothing else changes", () => {
    const f = bannerFrames({ columns: 80, level: 3, unicode: true, version: "0.2.0" });
    expect(f.length).toBe(2);
    expect(f[0]).not.toContain(VIOLET);
    expect(f[1]).toContain(VIOLET);
    const a = strip(f[0]!).split("\n");
    const b = strip(f[1]!).split("\n");
    expect(a.length).toBe(b.length);
    expect(a.filter((l, i) => l !== b[i])).toHaveLength(1); // only the line with the dot
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
});
