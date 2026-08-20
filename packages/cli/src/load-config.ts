import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ConcileConfig } from "@concile/component";

const CACHE_BUST = () => `?t=${Date.now()}`;

export async function loadConfig(projectDir: string): Promise<ConcileConfig> {
  const path = (["concile.config.ts", "concile.config.js"] as const)
    .map((f) => join(projectDir, f))
    .find((p) => existsSync(p));

  if (!path) return { components: [] };

  const mod = (await import(pathToFileURL(path).href + CACHE_BUST())) as {
    default?: ConcileConfig;
  } & ConcileConfig;
  const cfg = (mod.default ?? mod) as ConcileConfig;
  return { components: cfg.components ?? [], deploy: cfg.deploy, functionsDir: cfg.functionsDir };
}
