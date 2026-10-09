/**
 * Terminal output styling for the concile CLI — zero dependencies, degradation-first.
 *
 * Rules of the house:
 *  - Styling activates ONLY on a real interactive terminal (`isTTY`), and never when
 *    `NO_COLOR` (https://no-color.org) or `TERM=dumb` is set. Piped/CI output — including
 *    our own e2e tests, which scrape exact plain lines — stays byte-identical to the
 *    pre-styling CLI.
 *  - `concile serve` never imports this module's styled paths: production logs are a
 *    machine contract (grep-able lines, the `{"ready":…}` JSON handshake).
 *  - No frameworks here. The interactive dashboard (@concile/tui) is a separate,
 *    dynamically-imported package; this module is plain ANSI for run-and-exit commands.
 */

export type ColorLevel = 0 | 1 | 2 | 3;
export interface TermEnv { env: Record<string, string | undefined>; isTTY: boolean; platform: string }

/** Logo violet #6d4bd4, lifted for legibility on dark terminal backgrounds. */
export const BRAND_RGB = [0x8b, 0x6c, 0xf0] as const;

/**
 * How many colours to use. `honorForce` is for the installer only: `dev`/`serve`/`codegen`
 * output is scraped as plain text by e2e tests, and turbo/vitest may set FORCE_COLOR.
 */
export function detectColorLevel(t: TermEnv, opts: { honorForce?: boolean } = {}): ColorLevel {
  const e = t.env;
  if (e.NO_COLOR !== undefined || e.CONCILE_PLAIN !== undefined) return 0;
  if (opts.honorForce && e.FORCE_COLOR !== undefined) {
    if (e.FORCE_COLOR === "" || e.FORCE_COLOR === "true") return 1;
    const n = Number(e.FORCE_COLOR);
    return n >= 3 ? 3 : n === 2 ? 2 : n === 1 ? 1 : 0;
  }
  if (!t.isTTY || e.TERM === "dumb") return 0;
  if (e.COLORTERM === "truecolor" || e.COLORTERM === "24bit" || e.WT_SESSION || e.TERM_PROGRAM === "iTerm.app" || e.TERM_PROGRAM === "vscode") return 3;
  if (/-256(color)?$/.test(e.TERM ?? "") || t.platform === "win32") return 2;
  return 1;
}

export function supportsUnicode(t: TermEnv): boolean {
  if (t.env.CONCILE_ASCII !== undefined) return false;
  if (t.platform !== "win32") return t.env.TERM !== "linux";
  return Boolean(t.env.WT_SESSION || t.env.TERM_PROGRAM === "vscode" || t.env.ConEmuTask);
}

export function rgb(level: ColorLevel, r: number, g: number, b: number): (s: string) => string {
  if (level === 0) return (s) => s;
  if (level === 1) return (s) => `\x1b[35m${s}\x1b[39m`;
  if (level === 2) {
    const q = (v: number) => Math.round((v / 255) * 5);
    const code = 16 + 36 * q(r) + 6 * q(g) + q(b);
    return (s) => `\x1b[38;5;${code}m${s}\x1b[39m`;
  }
  return (s) => `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`;
}

export const styled: boolean =
  Boolean(process.stdout.isTTY) &&
  process.env.NO_COLOR === undefined &&
  process.env.TERM !== "dumb" &&
  process.env.CONCILE_PLAIN === undefined;

const wrap = (open: string, close: string) => (s: string) => (styled ? `[${open}m${s}[${close}m` : s);

export const bold = wrap("1", "22");
export const dim = wrap("2", "22");
export const red = wrap("31", "39");
export const green = wrap("32", "39");
export const yellow = wrap("33", "39");
export const blue = wrap("34", "39");
export const magenta = wrap("35", "39");
export const cyan = wrap("36", "39");
const runtimeLevel = detectColorLevel({ env: process.env, isTTY: Boolean(process.stdout.isTTY), platform: process.platform });
/** The concile brand violet (logo accent), at the colour depth this terminal supports. */
export const brand = (s: string) => (styled ? rgb(runtimeLevel, ...BRAND_RGB)(s) : s);

export const sym = {
  ok: green("✓"),
  fail: red("✗"),
  warn: yellow("⚠"),
  run: cyan("▸"),
  reload: cyan("↻"),
  mark: brand("◆"),
  arrow: dim("➜"),
} as const;

/** `◆ concile v0.1.4` header for run-and-exit commands. */
export function banner(subtitle?: string, version = ""): string {
  const parts = [`${sym.mark} ${bold("concile")}`, version ? dim(`v${version}`) : "", subtitle ? dim(subtitle) : ""];
  return parts.filter(Boolean).join(" ");
}

/** Aligned key→value rows: `  ➜  API        http://…` */
export function keyValues(rows: Array<[string, string]>): string {
  const w = Math.max(...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => `  ${sym.arrow}  ${bold(k.padEnd(w + 2))}${v}`).join("\n");
}

/** One status line: `  ✓ transpiled 12 modules   0.4s` */
export function status(kind: "ok" | "fail" | "warn" | "run", text: string, meta?: string): string {
  const icon = sym[kind === "run" ? "run" : kind];
  return `  ${icon} ${text}${meta ? `   ${dim(meta)}` : ""}`;
}

/**
 * The error block — errors are the product. Always multi-line, always actionable:
 * what failed, the detail, and (when the caller knows one) the way out.
 */
export function errorBlock(title: string, detail?: string, hint?: string): string {
  const lines = [`  ${sym.fail} ${bold(red(title))}`];
  if (detail) lines.push(...detail.trimEnd().split("\n").map((l) => `    ${l}`));
  if (hint) lines.push(`    ${cyan("→")} ${hint}`);
  return lines.join("\n");
}
