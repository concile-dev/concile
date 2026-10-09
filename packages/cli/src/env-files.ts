/**
 * `concile dev` reads `.env.local`, then `.env`, from the project root, the way frontend dev servers
 * do. `concile init` writes CONCILE_DATABASE_URL there, so without this dev would quietly use SQLite.
 * A key already in the environment always wins, and `.env.local` wins over `.env`.
 * Empty values are skipped: init writes `CONCILE_DATABASE_URL=` to mean "not set yet".
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(raw);
    if (!m) continue;
    let value = m[2]!.trim();
    const q = value[0];
    if ((q === '"' || q === "'") && value.indexOf(q, 1) > 0) value = value.slice(1, value.indexOf(q, 1));
    else value = value.replace(/\s+#.*$/, "");
    if (value !== "") out[m[1]!] = value;
  }
  return out;
}

export function loadEnvFiles(root: string, env: Record<string, string | undefined> = process.env): void {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    let text: string;
    try { text = readFileSync(path, "utf8"); } catch { continue; }
    for (const [k, v] of Object.entries(parseEnv(text))) if (env[k] === undefined) env[k] = v;
  }
}
