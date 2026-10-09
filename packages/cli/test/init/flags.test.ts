import { describe, it, expect } from "vitest";
import { parseInitFlags, isInteractive, isAgent, reproduceCommand } from "../../src/init/flags";

describe("flags", () => {
  it("parses folder and answer flags", () => {
    const f = parseInitFlags(["my-app", "--starter", "next", "--components", "auth,workflow", "--db", "postgres", "--database-url", "postgres://x", "--pm", "pnpm", "--no-install", "--dry-run", "--json"]);
    expect(f).toMatchObject({ folder: "my-app", starter: "next", components: ["auth", "workflow"], db: "postgres", databaseUrl: "postgres://x", pm: "pnpm", install: false, dryRun: true, json: true });
  });
  it("rejects unknown components", () => expect(() => parseInitFlags(["--components", "auth,nope"])).toThrow(/nope/));
  it("interactive only with two TTYs and no answer flags, CI or agent", () => {
    const none = parseInitFlags([]);
    expect(isInteractive(none, {}, true, true)).toBe(true);
    expect(isInteractive(none, {}, false, true)).toBe(false);
    expect(isInteractive(none, { CI: "true" }, true, true)).toBe(false);
    expect(isInteractive(none, { CLAUDECODE: "1" }, true, true)).toBe(false);
    expect(isInteractive(parseInitFlags(["--yes"]), {}, true, true)).toBe(false);
    expect(isInteractive(parseInitFlags(["--starter", "vite"]), {}, true, true)).toBe(false);
    expect(isAgent({ CURSOR_AGENT: "1" })).toBe(true);
  });
  it("prints a reproducible command", () => {
    expect(reproduceCommand(parseInitFlags(["app"]), { starter: "vite", components: ["auth"], db: "sqlite", databaseUrl: null }))
      .toBe("npx concile init app --yes --starter vite --components auth --db sqlite");
  });
});

describe("reproduceCommand safety", () => {
  it("quotes odd folder names and points at the env var instead of the database URL", () => {
    const cmd = reproduceCommand(parseInitFlags(["my app", "--pm", "pnpm", "--no-install"]), { starter: null, components: ["auth"], db: "postgres", databaseUrl: "postgres://u:s3cret@h:5432/db" });
    expect(cmd).toBe(`npx concile init 'my app' --yes --components auth --db postgres --database-url "$CONCILE_DATABASE_URL" --pm pnpm --no-install`);
    expect(cmd).not.toContain("s3cret");
    expect(cmd).not.toContain("***");
  });
});
