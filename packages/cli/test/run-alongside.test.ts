import { describe, it, expect } from "vitest";
import { runAlongside } from "../src/run-alongside";

const node = JSON.stringify(process.execPath);

describe("runAlongside (concile dev --run)", () => {
  it("prefixes every output line, stdout and stderr, and reports the exit code", async () => {
    const out: string[] = [];
    const app = runAlongside(`${node} -e "console.log('one');console.error('two');process.stdout.write('three');process.exit(3)"`, {
      cwd: process.cwd(),
      write: (s) => out.push(s),
    });
    expect(await app.exited).toBe(3);
    const text = out.join("");
    expect(text).toContain("app │ one\n");
    expect(text).toContain("app │ two\n");
    expect(text).toContain("app │ three\n"); // a last line without a newline is still flushed
  });

  it("stop() ends a long-running command, including what the shell started", async () => {
    const app = runAlongside(`${node} -e "setInterval(() => {}, 1000)"`, { cwd: process.cwd(), write: () => {} });
    await new Promise((r) => setTimeout(r, 300));
    app.stop();
    const code = await Promise.race([app.exited, new Promise<string>((r) => setTimeout(() => r("timeout"), 5000))]);
    expect(code).not.toBe("timeout");
    app.stop(); // a second stop is harmless
  });
});
