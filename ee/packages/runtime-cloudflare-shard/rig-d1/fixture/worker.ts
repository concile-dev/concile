/* Concile Enterprise. Licensed under the Concile Commercial License — see ee/LICENSE. */

/**
 * The combined multi-shard + `.global()`/D1 Worker/DO entry — a hand-written stand-in for what a
 * D1-aware `generateShardWorkerEntrySource` would codegen (the shipped codegen is R2-aware but not
 * yet D1-aware). Same shape as `../rig/fixture/worker.ts`, with ONE addition: it wires the shared D1
 * database (`env.DB`) into every shard-DO's `appConfig` via `bindingD1Client`, so `.global()` tables
 * route to D1 while sharded tables stay in each DO's own DO-SQLite.
 *
 *   - `export class ConcileDO extends ConcileDurableObject` — the (unmodified) shard-DO class; the
 *     router addresses N instances of it by shard-key name, and each one shares the same D1 binding.
 *   - `export default createShardWorkerHandler("CONCILE_DO", { mode: "key", loaded })` — the
 *     stateless multi-shard router.
 */
import {
  ConcileDurableObject,
  createShardWorkerHandler,
  type DurableObjectAppConfig,
} from "@concile/runtime-cloudflare-shard";
import { bindingD1Client, type D1Binding } from "@concile/docstore-d1";
import type { LoadedProject } from "@concile/cli/project";
import schema from "./convex/schema";
import * as messages from "./convex/messages";
import * as counters from "./convex/counters";

const loaded: LoadedProject = { schema, modules: { messages, counters } };

export class ConcileDO extends ConcileDurableObject {
  protected appConfig(env: Record<string, unknown>): DurableObjectAppConfig {
    const db = (env as { DB?: D1Binding }).DB;
    return {
      loaded,
      adminKey: (env.CONCILE_ADMIN_KEY as string | undefined) ?? "",
      // The `.global()` tables' store: the shared D1 database bound as `env.DB`. Guarded so a deploy
      // without the binding degrades to sharded-only rather than throwing at boot. `.global()` D1
      // tables/indexes are auto-created on first DO boot with DB present — no migration step.
      ...(db ? { d1: bindingD1Client(db) } : {}),
    };
  }
}

export default createShardWorkerHandler("CONCILE_DO", { mode: "key", loaded });
