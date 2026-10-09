import type { Answers } from "./plan";
import type { PackageManager } from "./detect";
import { isComponentId, type ComponentId, type StarterId } from "./registry";

export interface InitFlags {
  folder: string | null; yes: boolean; starter: StarterId | null; components: ComponentId[] | null;
  db: "sqlite" | "postgres" | null; databaseUrl: string | null; pm: PackageManager | null;
  install: boolean; dryRun: boolean; json: boolean; help: boolean;
}

const AGENT_VARS = ["CLAUDECODE", "CLAUDE_CODE", "CURSOR_AGENT", "GEMINI_CLI", "CODEX_SANDBOX", "OPENCODE", "AMP_AGENT", "AGENT"];

export function isAgent(env: Record<string, string | undefined>): boolean {
  return AGENT_VARS.some((v) => env[v] !== undefined && env[v] !== "");
}

export function parseInitFlags(args: string[]): InitFlags {
  const f: InitFlags = { folder: null, yes: false, starter: null, components: null, db: null, databaseUrl: null, pm: null, install: true, dryRun: false, json: false, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const next = () => { const v = args[++i]; if (v === undefined) throw new Error(`${a} needs a value`); return v; };
    if (a === "--yes" || a === "-y") f.yes = true;
    else if (a === "--starter") { const v = next(); if (!["vite", "next", "none"].includes(v)) throw new Error(`--starter must be vite, next or none`); f.starter = v as StarterId; }
    else if (a === "--components") {
      const ids = next().split(",").map((s) => s.trim()).filter(Boolean);
      const bad = ids.filter((s) => !isComponentId(s));
      if (bad.length) throw new Error(`unknown component: ${bad.join(", ")}`);
      f.components = ids as ComponentId[];
    } else if (a === "--db") { const v = next(); if (v !== "sqlite" && v !== "postgres") throw new Error("--db must be sqlite or postgres"); f.db = v; }
    else if (a === "--database-url") f.databaseUrl = next();
    else if (a === "--pm") { const v = next(); if (!["npm", "pnpm", "yarn", "bun"].includes(v)) throw new Error("--pm must be npm, pnpm, yarn or bun"); f.pm = v as PackageManager; }
    else if (a === "--no-install") f.install = false;
    else if (a === "--dry-run") f.dryRun = true;
    else if (a === "--json") f.json = true;
    else if (a === "--help" || a === "-h") f.help = true;
    else if (!a.startsWith("-") && f.folder === null) f.folder = a;
    else throw new Error(`unknown option: ${a}`);
  }
  return f;
}

export function isInteractive(f: InitFlags, env: Record<string, string | undefined>, stdinTTY: boolean, stdoutTTY: boolean): boolean {
  const answerFlag = f.starter !== null || f.components !== null || f.db !== null || f.databaseUrl !== null || f.json;
  return stdinTTY && stdoutTTY && !f.yes && !answerFlag && !env.CI && !isAgent(env);
}

/** Quotes a value for a POSIX shell when it has anything beyond plain path characters. */
function shellArg(s: string): string {
  return /^[A-Za-z0-9_.,:/@=+-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
}

export function reproduceCommand(f: InitFlags, a: Answers): string {
  const parts = ["npx concile init"];
  if (f.folder) parts.push(shellArg(f.folder));
  parts.push("--yes");
  if (a.starter) parts.push("--starter", a.starter);
  parts.push("--components", a.components.join(",") || '""');
  parts.push("--db", a.db);
  // Never print the URL itself (it holds a password); point at the env var init wrote instead.
  if (a.databaseUrl) parts.push("--database-url", '"$CONCILE_DATABASE_URL"');
  if (f.pm) parts.push("--pm", f.pm);
  if (!f.install) parts.push("--no-install");
  return parts.join(" ");
}
