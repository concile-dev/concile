import { BRAND_RGB, rgb, type ColorLevel } from "../ui";

export interface BannerOptions { columns: number; level: ColorLevel; unicode: boolean; version: string }

// The display wordmark, copied from www/components/brand-grid.ts (keep them in step): the name
// in the mark's own cells, lowercase, with the dot of the i as the one violet cell. The brand uses
// it stand-alone for hero moments, so the banner shows it without the mark.
const GLYPHS: Record<string, string[]> = {
  c: ["", "", ".XXX", "X...", "X...", "X...", ".XXX"],
  o: ["", "", ".XX.", "X..X", "X..X", "X..X", ".XX."],
  n: ["", "", "XXX.", "X..X", "X..X", "X..X", "X..X"],
  i: ["V", "", "X", "X", "X", "X", "X"],
  l: ["X", "X", "X", "X", "X", "X", "X"],
  e: ["", "", ".XX.", "X..X", "XXXX", "X...", ".XXX"],
};

/** "concile" on one 7-row grid, one blank column between letters. */
function wordRows(): string[] {
  const rows = Array.from({ length: 7 }, () => "");
  [..."concile"].forEach((ch, n) => {
    const g = GLYPHS[ch]!;
    const w = Math.max(...g.map((r) => r.length));
    for (let r = 0; r < 7; r++) rows[r] += (n ? "." : "") + (g[r] ?? "").padEnd(w, ".");
  });
  return rows;
}
const WORD_ROWS = wordRows();

// First animation frame: the i without its dot. The violet cell then drops into place.
const WORD_ARRIVING = WORD_ROWS.map((r, i) => (i === 0 ? r.replace("V", ".") : r));

/**
 * One brand cell is half a character cell: two grid rows share a line through ▀ ▄ █. A cell is
 * about as wide as it is tall, so the letters keep their shape at 4 lines high. Plain cells use the
 * terminal's own foreground (right on dark and light themes) and V is brand violet. Where two
 * kinds would share a character, V wins.
 */
function render(rows: string[], level: ColorLevel): string[] {
  const violet = rgb(level, ...BRAND_RGB);
  const kind = (c: string | undefined) => (c === "X" ? "x" : c === "V" ? "v" : null);
  const paint = (k: string, s: string) => (k === "v" ? violet(s) : s);
  const out: string[] = [];
  for (let r = 0; r < rows.length; r += 2) {
    const top = rows[r]!;
    const bottom = rows[r + 1] ?? "";
    let line = "";
    for (let c = 0; c < top.length; c++) {
      const t = kind(top[c]);
      const b = kind(bottom[c]);
      if (!t && !b) line += " ";
      else if (t === b) line += paint(t!, "█");
      else if (t === "v" || (t && !b)) line += paint(t!, "▀");
      else line += paint(b!, "▄");
    }
    out.push(line);
  }
  return out;
}

const TAGLINE = "the reactive backend you self-host";
const DOCS = "concile.dev/docs";
/** Columns the wordmark needs. @internal exported for tests. */
export const WIDE = 2 + WORD_ROWS[0]!.length;

/** The right-hand column of the boxed banner, one line per wordmark row. */
function infoLines(o: BannerOptions): string[] {
  const dim = (s: string) => (o.level === 0 ? s : `\x1b[2m${s}\x1b[22m`);
  const bold = (s: string) => (o.level === 0 ? s : `\x1b[1m${s}\x1b[22m`);
  return [
    `${bold("concile init")} ${dim(`v${o.version}`)}`,
    dim(TAGLINE),
    `${dim("docs")} ${DOCS}`,
    dim("nothing changes until you say yes"),
  ];
}
const INFO_W = Math.max(TAGLINE.length, "concile init v0.00.00".length, `docs ${DOCS}`.length, "nothing changes until you say yes".length);
// │ 2 wordmark 2 │ 2 info 2 │
const INNER_LEFT = 2 + WORD_ROWS[0]!.length + 2;
const INNER_RIGHT = 2 + INFO_W + 2;
/** Columns the boxed banner needs. @internal exported for tests. */
export const BOXED = 1 + INNER_LEFT + 1 + INNER_RIGHT + 1;

export function plainBannerLine(version: string): string {
  return `concile init v${version}`;
}

const visible = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
const padTo = (s: string, w: number) => s + " ".repeat(Math.max(0, w - visible(s)));

/**
 * One wide box: the wordmark on the left, a separator, the essentials on the right. The
 * border and the secondary text are dim, so the violet dot of the i stays the one accent.
 */
function boxed(word: string[], o: BannerOptions): string[] {
  const dim = (s: string) => (o.level === 0 ? s : `\x1b[2m${s}\x1b[22m`);
  const info = infoLines(o);
  const bar = dim("│");
  const row = (left: string, right: string) => `${bar}${padTo(left, INNER_LEFT)}${bar}${padTo(right, INNER_RIGHT)}${bar}`;
  // Starts in column 0, the column of the prompts' vertical bar below it.
  return [
    dim(`╭${"─".repeat(INNER_LEFT)}┬${"─".repeat(INNER_RIGHT)}╮`),
    row("", ""),
    ...word.map((l, i) => row(`  ${l}`, `  ${info[i] ?? ""}`)),
    row("", ""),
    dim(`╰${"─".repeat(INNER_LEFT)}┴${"─".repeat(INNER_RIGHT)}╯`),
  ];
}

function frame(word: string[], o: BannerOptions): string {
  const dim = (s: string) => (o.level === 0 ? s : `\x1b[2m${s}\x1b[22m`);
  if (o.columns >= BOXED) return ["", ...boxed(render(word, o.level), o), ""].join("\n");
  const lines: string[] = [""];
  if (o.columns >= WIDE) for (const l of render(word, o.level)) lines.push(`  ${l}`.replace(/\s+$/, ""));
  else lines.push(`  ${rgb(o.level, ...BRAND_RGB)("concile")}`);
  lines.push("", `  ${dim(`${TAGLINE} · v${o.version}`)}`, "");
  return lines.join("\n");
}

export function bannerFrames(o: BannerOptions): string[] {
  if (!o.unicode) return [["", "  concile", `  the reactive backend you self-host - v${o.version}`, ""].join("\n")];
  if (o.level === 0 || o.columns < WIDE) return [frame(WORD_ROWS, o)];
  return [frame(WORD_ARRIVING, o), frame(WORD_ROWS, o)];
}

export async function showBanner(o: BannerOptions, write: (s: string) => void, animate: boolean): Promise<void> {
  const frames = bannerFrames(o);
  if (!animate || frames.length === 1) {
    write(frames[frames.length - 1]! + "\n");
    return;
  }
  write(frames[0]! + "\n");
  await new Promise((r) => setTimeout(r, 180));
  const up = frames[0]!.split("\n").length;
  write(`\x1b[${up}F\x1b[J` + frames[1]! + "\n");
}
