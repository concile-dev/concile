import { spawn, type ChildProcess } from "node:child_process";

export interface Alongside {
  /** Stops the command and everything it started. Safe to call more than once. */
  stop(): void;
  /** Resolves with the exit code once the command has exited. */
  exited: Promise<number>;
}

/**
 * `concile dev --run "<cmd>"`: runs the frontend dev server next to the backend, so one command
 * starts both. Output lines get a short prefix so they read apart from the backend's own lines.
 * The command runs through the shell (it is a script line like "next dev -p 3001"), in its own
 * process group on POSIX so stop() also reaches the grandchildren a package manager spawns.
 */
export function runAlongside(
  command: string,
  opts: { cwd: string; write: (s: string) => void; prefix?: string; env?: NodeJS.ProcessEnv },
): Alongside {
  const prefix = opts.prefix ?? "app │ ";
  const posix = process.platform !== "win32";
  const child: ChildProcess = spawn(command, {
    cwd: opts.cwd,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
    detached: posix,
    env: { ...process.env, ...opts.env },
  });

  const relay = (stream: NodeJS.ReadableStream | null) => {
    let buf = "";
    stream?.on("data", (d: Buffer) => {
      buf += String(d);
      const lines = buf.split(/\r?\n/);
      buf = lines.pop() ?? "";
      for (const l of lines) opts.write(`${prefix}${l}\n`);
    });
    stream?.on("end", () => {
      if (buf) opts.write(`${prefix}${buf}\n`);
      buf = "";
    });
  };
  relay(child.stdout);
  relay(child.stderr);

  let done = false;
  const exited = new Promise<number>((resolve) => {
    child.on("error", (e) => {
      opts.write(`${prefix}could not start "${command}": ${e.message}\n`);
      done = true;
      resolve(1);
    });
    child.on("exit", (code, signal) => {
      done = true;
      resolve(code ?? (signal ? 1 : 0));
    });
  });

  const stop = () => {
    if (done || child.pid === undefined) return;
    try {
      if (posix) process.kill(-child.pid, "SIGTERM");
      else child.kill();
    } catch {
      // Already gone.
    }
  };
  return { stop, exited };
}
