import { describe, it, expect } from "vitest";
import { clackPrompter, plainPrompter } from "../../src/init/prompts";

const term = (env: Record<string, string | undefined>, out: string[]) => ({ env, isTTY: true, platform: "darwin", columns: 100, write: (s: string) => { out.push(s); } });

describe("clackPrompter intro", () => {
  it("shows one plain line when colour is off (NO_COLOR)", async () => {
    const out: string[] = [];
    await clackPrompter("1.2.3", term({ NO_COLOR: "1", TERM: "xterm-256color" }, out)).intro();
    expect(out.join("")).toBe("concile init v1.2.3\n");
  });
  it("shows one plain line on TERM=dumb", async () => {
    const out: string[] = [];
    await clackPrompter("1.2.3", term({ TERM: "dumb" }, out)).intro();
    expect(out.join("")).toBe("concile init v1.2.3\n");
  });
  it("shows the logo banner with colour", async () => {
    const out: string[] = [];
    await clackPrompter("1.2.3", term({ TERM: "xterm-256color", COLORTERM: "truecolor" }, out)).intro();
    expect(out.join("")).toContain("██");
    expect(out.join("")).toContain("v1.2.3");
  });
});

describe("plainPrompter", () => {
  it("refuses every question, so a non-interactive run can never block on stdin", () => {
    const ui = plainPrompter(() => {});
    expect(() => ui.askMigrate()).toThrow(/cannot ask/);
    expect(() => ui.askStartDev()).toThrow(/cannot ask/);
  });
});
