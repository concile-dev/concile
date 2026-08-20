/**
 * M2c Task 7 fixture — a `.global()` D1-backed table exactly like `global-d1-fixture.ts`'s `GlobalD1DO`,
 * PLUS a near-zero `globalReactivityPollMs` (see `DurableObjectAppConfig`'s doc in `durable-object.ts`).
 *
 * Why a separate fixture rather than reusing `GlobalD1DO`: `global-reactivity-e2e.test.ts` needs to
 * drive the poller deterministically via `runDurableObjectAlarm` (`cloudflare:test`) with no real
 * wall-clock sleep. `runDurableObjectAlarm` force-clears+re-fires whatever alarm is CURRENTLY scheduled
 * on the DO, but the runtime's own `fireDueTimers` still gates each due driver timer on its in-process
 * `atMs <= now()` check. A REAL Durable Object's module scope is its own isolated evaluation — a test
 * file cannot share a mutable injected clock with it the way the Node-fake `global-reactivity-driver.test.ts`
 * shares its `let clock` closure directly with an in-process `ConcileDurableObject` instance. Instead,
 * this fixture arms the poller at an effectively-zero interval (`globalReactivityPollMs: 0` — the poller
 * still fires ONLY when explicitly triggered via `runDurableObjectAlarm`, never a free-running timer),
 * so that by the time the test's own inherent async overhead (WS upgrade, D1 round-trips) elapses, the
 * armed timer's `atMs` (= arm-time + 0) is already <= real `now()` — genuinely due, with no explicit
 * `setTimeout`/sleep anywhere in the test.
 */
import { query, mutation } from "@concile/executor";
import { v, defineSchema, defineTable } from "@concile/values";
import type { LoadedProject } from "@concile/cli/project";
import { ConcileDurableObject, type DurableObjectAppConfig } from "@concile/runtime-cloudflare";
import { bindingD1Client, type D1Binding } from "@concile/docstore-d1";

const schema = defineSchema({
  counters: defineTable({ key: v.string(), value: v.number() })
    .index("by_key", ["key"], { unique: true })
    .global(),
});

const counters = {
  create: mutation({
    handler: (ctx, { key, value }: { key: string; value: number }) => ctx.db.insert("counters", { key, value }),
  }),
  getByKey: query({
    handler: async (ctx, { key }: { key: string }) => {
      const rows = await ctx.db.query("counters", "by_key").eq("key", key).collect();
      return (rows[0] as { _id: string; key: string; value: number } | undefined) ?? null;
    },
  }),
  // Same-mutation read-your-own-writes (mirrors `global-d1-fixture.ts`'s `counters.createAndReadBack`).
  createAndReadBack: mutation({
    handler: async (ctx, { key, value }: { key: string; value: number }) => {
      const id = await ctx.db.insert("counters", { key, value });
      const byId = await ctx.db.get(id);
      const byIndex = await ctx.db.query("counters", "by_key").eq("key", key).collect();
      return { id, byId, byIndexCount: byIndex.length };
    },
  }),
};

const loaded: LoadedProject = { schema, modules: { counters } };

export class GlobalReactivityDO extends ConcileDurableObject {
  protected appConfig(env: unknown): DurableObjectAppConfig {
    const db = (env as { DB?: D1Binding }).DB;
    return {
      loaded,
      adminKey: "global-reactivity-admin-key",
      globalReactivityPollMs: 0,
      ...(db ? { d1: bindingD1Client(db) } : {}),
    };
  }
}
