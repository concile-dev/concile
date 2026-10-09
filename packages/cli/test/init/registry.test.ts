import { describe, it, expect, afterAll } from "vitest";
import { generateServer } from "@concile/codegen";
import { COMPONENTS, CORE_PACKAGES, MIN_NODE, withRequirements, FRAMEWORKS, componentById } from "../../src/init/registry";

describe("registry", () => {
  it("adds requirements and keeps registry order", () => {
    expect(withRequirements(["workflow"])).toEqual(["scheduler", "workflow"]);
    expect(withRequirements(["authz"])).toEqual(["auth", "authz"]);
    expect(withRequirements(["workflow", "auth"])).toEqual(["auth", "scheduler", "workflow"]);
  });

  it("every component imports from its own package and names a define call", () => {
    for (const c of COMPONENTS) {
      expect(c.pkg).toBe(`@concile/${c.id}`);
      expect(c.expr.startsWith(c.imports[0] + "(")).toBe(true);
    }
  });

  it("generated imports are installed (pnpm strict mode)", () => {
    const { content } = generateServer({ tables: {}, schemaValidation: false }, { components: [] });
    const specifiers = [...content.matchAll(/from "(@concile\/[a-z-]+)/g)].map((m) => m[1]);
    for (const s of specifiers) expect(CORE_PACKAGES).toContain(s);
  });

  it("every bare import in the generated config is installed", () => {
    const all = COMPONENTS.map((c) => c.id);
    const src = renderConfig(withRequirements(all));
    const specifiers = [...src.matchAll(/from "([^".][^"]*)"/g)].map((m) => m[1]!);
    expect(specifiers.length).toBeGreaterThan(all.length);
    const installed = new Set([...CORE_PACKAGES, ...COMPONENTS.map((c) => c.pkg)]);
    for (const s of specifiers) expect([...installed]).toContain(s);
  });

  it("MIN_NODE is the first Node that strips TypeScript types by default", () => {
    expect(MIN_NODE).toBe("22.18.0");
  });

  it("frameworks have env prefixes", () => {
    expect(FRAMEWORKS.find((f) => f.id === "next")!.envPrefix).toBe("NEXT_PUBLIC_");
    expect(FRAMEWORKS.find((f) => f.id === "vite")!.envPrefix).toBe("VITE_");
    expect(componentById("auth").label).toBe("auth");
  });
});

import { mkdtempSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../../src/load-config";
import { renderConfig } from "../../src/init/config-edit";

const cliDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("every component's minimal config loads", () => {
  afterAll(() => {
    for (const d of readdirSync(cliDir)) if (d.startsWith(".tmp-reg-")) rmSync(join(cliDir, d), { recursive: true, force: true });
  });
  for (const c of COMPONENTS) {
    it(c.id, async () => {
      const dir = mkdtempSync(join(cliDir, ".tmp-reg-"));
      writeFileSync(join(dir, "concile.config.ts"), renderConfig(withRequirements([c.id])));
      const cfg = await loadConfig(dir);
      expect(cfg.components.map((x) => x.name)).toContain(c.id);
    });
  }
});
