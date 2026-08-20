import { describe, it, expect } from "vitest";
import { concile } from "../src/index";
import { isEnginePath } from "../src/embed";

describe("concile() mode switch", () => {
  it("mode:'embed' returns the embed plugin — a configureServer hook and NO proxy config hook", () => {
    const p = concile({ mode: "embed" });
    expect(p.name).toBe("concile:embed");
    expect(p.configureServer).toBeTypeOf("function");
    // No `config` hook at all — embed serves the engine in-process, so there's no origin to proxy.
    expect(p.config).toBeUndefined();
  });

  it("default and mode:'proxy' are the unchanged Phase-1 plugin (name 'concile', has a config hook)", () => {
    for (const p of [concile(), concile({ mode: "proxy" })]) {
      expect(p.name).toBe("concile");
      expect(p.config).toBeTypeOf("function");
      expect(p.configureServer).toBeTypeOf("function");
    }
  });
});

describe("isEnginePath (embed-mode routing predicate)", () => {
  it("matches only the engine-owned prefixes", () => {
    for (const p of [
      "/api",
      "/api/health",
      "/api/run",
      "/api/sync",
      "/api/storage/abc",
      "/api/auth/oauth/callback",
      "/_admin",
      "/_admin/deploy/modules",
      "/_dashboard",
      "/_dashboard/",
    ]) {
      expect(isEnginePath(p)).toBe(true);
    }
  });

  it("falls through (→ Vite) for everything else, including deceptively-similar paths", () => {
    for (const p of ["/", "/index.html", "/src/main.ts", "/@vite/client", "/@id/x", "/apiary", "/_adminish", "/assets/x.js"]) {
      expect(isEnginePath(p)).toBe(false);
    }
  });
});
