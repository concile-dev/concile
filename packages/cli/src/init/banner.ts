import { BRAND_RGB, rgb, type ColorLevel } from "../ui";

export interface BannerOptions { columns: number; level: ColorLevel; unicode: boolean; version: string }

// The logo mark from www/public/brand/concile-mark.svg on its 8-unit grid. `▓▓` is the single
// violet cell; `▪` are the small dissolving cells.
const MARK = [
  "    ████████▪   ",
  "  ██████████▪ ▪ ",
  "████        ▪ ▪ ",
  "████          ▓▓",
  "████        ▪ ▪ ",
  "  ██████████▪ ▪ ",
  "    ████████▪   ",
];
// First animation frame: the violet cell two columns out, "arriving".
const MARK_ARRIVING = MARK.map((l, i) => (i === 3 ? "████            " : l));
const ARRIVING_CELL_ROW = 3;

const WORD = [
  " ██████╗ ██████╗ ███╗   ██╗ ██████╗██╗██╗     ███████╗",
  "██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██║     ██╔════╝",
  "██║     ██║   ██║██╔██╗ ██║██║     ██║██║     █████╗  ",
  "██║     ██║   ██║██║╚██╗██║██║     ██║██║     ██╔══╝  ",
  "╚██████╗╚██████╔╝██║ ╚████║╚██████╗██║███████╗███████╗",
  " ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝╚═╝╚══════╝╚══════╝",
];
/**
 * Wordmark rows, light to dark. Mid greys only: they must read on a dark terminal and on a white one
 * (macOS Terminal's default). At 256 colours these land on cube greys 175 and 135, never near-white.
 * @internal exported for tests.
 */
export const GREYS = [175, 160, 145, 130, 115, 100];
const WIDE = 2 + MARK[0]!.length + 3 + WORD[0]!.length; // 75 (2 + 16 + 3 + 54)

export function plainBannerLine(version: string): string {
  return `concile init v${version}`;
}

function paintMark(line: string, level: ColorLevel): string {
  const violet = rgb(level, ...BRAND_RGB);
  return line.replace("▓▓", violet("██"));
}

function frame(mark: string[], o: BannerOptions, extraCell: boolean): string {
  const violet = rgb(o.level, ...BRAND_RGB);
  const dim = (s: string) => (o.level === 0 ? s : `\x1b[2m${s}\x1b[22m`);
  const tagline = `  ${dim(`the reactive backend you self-host · v${o.version}`)}`;
  const rows: string[] = [""];
  if (o.columns >= WIDE) {
    for (let i = 0; i < mark.length; i++) {
      let m = paintMark(mark[i] ?? "", o.level);
      if (extraCell && i === ARRIVING_CELL_ROW) m = `${m}${violet("██")}`;
      const w = i === 0 ? "" : WORD[i - 1] ?? "";
      const g = GREYS[i - 1] ?? 100;
      const pad = extraCell && i === ARRIVING_CELL_ROW ? " " : "   ";
      rows.push(`  ${m}${w ? pad + rgb(o.level, g, g, g)(w) : ""}`.replace(/\s+$/, ""));
    }
  } else {
    for (let i = 0; i < mark.length; i++) {
      let m = paintMark(mark[i] ?? "", o.level);
      if (extraCell && i === ARRIVING_CELL_ROW) m = `${m}${violet("██")}`;
      rows.push(`  ${m}`.replace(/\s+$/, ""));
    }
    rows.push("", `  ${violet("concile")}`);
  }
  rows.push("", tagline, "");
  return rows.join("\n");
}

export function bannerFrames(o: BannerOptions): string[] {
  if (!o.unicode) return [["", "  concile", `  the reactive backend you self-host - v${o.version}`, ""].join("\n")];
  if (o.level === 0) return [frame(MARK, o, false)];
  return [frame(MARK_ARRIVING, o, true), frame(MARK, o, false)];
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
