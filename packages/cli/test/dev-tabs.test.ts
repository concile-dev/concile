import { describe, it, expect } from "vitest";
import { createServer } from "node:net";
import { afterBackend, backendUrl, mprocsBinary, tabsConfig, wantTabs } from "../src/dev-tabs";

describe("dev tabs", () => {
  const tty = { env: {}, stdinTTY: true, stdoutTTY: true };
  it("uses tabs only in a real terminal, never for CI, agents, --no-ui or CONCILE_TABS=0", () => {
    expect(wantTabs(tty)).toBe(true);
    expect(wantTabs({ ...tty, stdoutTTY: false })).toBe(false);
    expect(wantTabs({ ...tty, noUi: true })).toBe(false);
    expect(wantTabs({ ...tty, env: { CI: "1" } })).toBe(false);
    expect(wantTabs({ ...tty, env: { CLAUDECODE: "1" } })).toBe(false);
    expect(wantTabs({ ...tty, env: { CONCILE_TABS: "0" } })).toBe(false);
  });

  it("the app reaches a wildcard bind through loopback", () => {
    expect(backendUrl("0.0.0.0", 3000)).toBe("http://127.0.0.1:3000");
    expect(backendUrl("127.0.0.1", 4000)).toBe("http://127.0.0.1:4000");
    expect(backendUrl("::1", 3000)).toBe("http://[::1]:3000");
  });

  it("one tab runs the backend without its own UI, the other waits for it and runs the app", () => {
    const cfg = tabsConfig({ devArgs: ["--port", "4000"], run: "vite", cwd: "/app", url: "http://127.0.0.1:4000" }) as {
      procs: Record<string, { cmd: string[]; env?: Record<string, string> }>;
    };
    expect(Object.keys(cfg.procs)).toEqual(["concile", "app"]);
    expect(cfg.procs.concile!.cmd.slice(2)).toEqual(["dev", "--no-ui", "--port", "4000"]);
    expect(cfg.procs.app!.cmd.slice(2)).toEqual(["__after-backend", "http://127.0.0.1:4000", "vite"]);
    expect(cfg.procs.app!.env).toEqual({ CONCILE_DEV_BACKEND: "http://127.0.0.1:4000" });
  });

  it("ships the mprocs binary for this platform", () => {
    expect(mprocsBinary()).toMatch(/mprocs/);
  });

  it("the app starts only once the backend listens", async () => {
    const server = createServer();
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port;
    const out: string[] = [];
    const code = await afterBackend([`http://127.0.0.1:${port}`, "exit 3"], { write: (s) => out.push(s) });
    server.close();
    expect(code).toBe(3);
    expect(out).toEqual([]); // already listening: no waiting message
  });

  it("starts the app anyway when the backend never comes up", async () => {
    const out: string[] = [];
    const code = await afterBackend(["http://127.0.0.1:1", "exit 0"], { timeoutMs: 300, write: (s) => out.push(s) });
    expect(code).toBe(0);
    expect(out.join("")).toContain("Starting the app anyway");
  });
});
