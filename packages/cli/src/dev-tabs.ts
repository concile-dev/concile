/**
 * `concile dev --run "<cmd>"` in a real terminal: the backend and the app each get their own tab
 * (mprocs, a terminal UI for running several processes). Each tab shows one process's own output,
 * so it is always clear which URL belongs to which server. Without a terminal (CI, agents, pipes)
 * the caller keeps the plain prefixed output instead.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isAgent } from "./init/flags";

/** Env var the app process gets: where the backend listens. @concile/vite proxies to it instead of starting its own. */
export const BACKEND_ENV = "CONCILE_DEV_BACKEND";

/** The mprocs binary, or null when the package or this platform's build is missing. */
export function mprocsBinary(): string | null {
  try {
    return createRequire(import.meta.url)("mprocs") as string;
  } catch {
    return null;
  }
}

export function wantTabs(o: { noUi?: boolean; env: NodeJS.ProcessEnv; stdinTTY: boolean; stdoutTTY: boolean }): boolean {
  if (o.noUi || o.env.CONCILE_TABS === "0" || o.env.CI) return false;
  if (isAgent(o.env)) return false;
  return o.stdinTTY && o.stdoutTTY;
}

/** The URL the app reaches the backend on. A wildcard bind is still reached through loopback. */
export function backendUrl(ip: string, port: number): string {
  const host = ip === "0.0.0.0" || ip === "::" ? "127.0.0.1" : ip.includes(":") ? `[${ip}]` : ip;
  return `http://${host}:${port}`;
}

/** @internal exported for tests. The mprocs config: the backend tab, then the app tab. */
export function tabsConfig(o: { devArgs: string[]; run: string; cwd: string; url: string }): object {
  const bin = fileURLToPath(new URL("./bin.js", import.meta.url));
  return {
    proc_list_title: "concile dev",
    procs: {
      concile: { cmd: [process.execPath, bin, "dev", "--no-ui", ...o.devArgs], cwd: o.cwd },
      // The app waits for the backend, so it can connect at once and never takes the backend's port.
      app: { cmd: [process.execPath, bin, "__after-backend", o.url, o.run], cwd: o.cwd, env: { [BACKEND_ENV]: o.url } },
    },
  };
}

/** Runs both processes in tabs and returns when the user quits. */
export function runInTabs(binary: string, o: { devArgs: string[]; run: string; cwd: string; url: string }): Promise<number> {
  const dir = mkdtempSync(join(tmpdir(), "concile-tabs-"));
  const config = join(dir, "mprocs.yaml"); // JSON is valid YAML
  writeFileSync(config, JSON.stringify(tabsConfig(o)));
  return new Promise((resolve) => {
    const child = spawn(binary, ["--config", config], { stdio: "inherit", cwd: o.cwd });
    child.on("error", () => resolve(1));
    child.on("exit", (code) => resolve(code ?? 0));
  });
}

function portOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createConnection({ host, port });
    s.once("connect", () => { s.destroy(); resolve(true); });
    s.once("error", () => resolve(false));
  });
}

/**
 * `concile __after-backend <url> <cmd>` (internal, the app tab): waits until the backend
 * listens, then runs the app command in this terminal. After a minute it starts the app anyway.
 */
export async function afterBackend(args: string[], opts: { timeoutMs?: number; write?: (s: string) => void } = {}): Promise<number> {
  const [url, command] = args;
  if (!url || !command) return 2;
  const write = opts.write ?? ((s: string) => process.stdout.write(s));
  const { hostname, port } = new URL(url);
  const host = hostname.replace(/^\[|\]$/g, "");
  const deadline = Date.now() + (opts.timeoutMs ?? 60_000);
  let said = false;
  while (!(await portOpen(host, Number(port)))) {
    if (Date.now() > deadline) {
      write(`The backend is not up yet. Starting the app anyway.\n`);
      break;
    }
    if (!said) write(`Waiting for the backend on ${url}…\n`);
    said = true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, stdio: "inherit" });
    const forward = (sig: NodeJS.Signals) => child.kill(sig);
    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.on(sig, forward);
    child.on("error", (e) => { write(`Could not start "${command}": ${e.message}\n`); resolve(1); });
    child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}
