/**
 * A brand-new project's function files import `./_generated/server` before anything has written
 * it, and `loadFunctionsDir` bundles those files, so the very first `dev`/`codegen` crashed with
 * `Could not resolve "./_generated/server"`. `generateServer`'s output depends only on the
 * composed components (not the schema), so a stub written from the config is safe; the real
 * codegen overwrites it moments later. `migrate` already did this inline; every loader now shares it.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateServer } from "@concile/codegen";
import type { ComponentDefinition } from "@concile/component";

export function ensureGeneratedStub(functionsDir: string, components: ComponentDefinition[]): boolean {
  const generatedDir = join(functionsDir, "_generated");
  if (existsSync(join(generatedDir, "server.ts"))) return false;
  const stub = generateServer(
    { tables: {}, schemaValidation: false },
    { components: components.map((c) => ({ name: c.name, contextType: c.contextType, serverExports: c.serverExports })) },
  );
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(join(generatedDir, "server.ts"), stub.content);
  return true;
}
