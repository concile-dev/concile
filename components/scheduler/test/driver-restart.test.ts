import { describe, it, expect } from "vitest";
import type { DriverContext } from "@concile/component";
import { schedulerDriver } from "../src/driver";

/**
 * Regression: a stopped driver must come back when `start()` is called again on the SAME instance.
 *
 * The fleet restarts drivers on the same instances: "drivers follow the default shard", so a node
 * that releases the default shard runs `stop()`, and if it later re-acquires the shard the runtime
 * calls `start()` again (`EmbeddedRuntime.startDrivers`, which already resets its own
 * `driversStarted` flag for exactly this reason). `stop()` sets the `stopped` guard so an in-flight
 * pass can't resurrect the loop after teardown. If `start()` does not clear that guard, every later
 * `wake()` and `armSweep()` returns early: the driver subscribes to commits again and then ignores
 * all of them. Nothing dispatches, nothing sweeps, and no error is logged.
 *
 * That is how the fleet e2e's "tick chain to resume on the survivor" wait timed out: the survivor
 * had held and released the default shard earlier in the run, so its scheduler was a stopped
 * instance, and re-acquiring the shard restarted a driver that could no longer wake.
 *
 * Driven with a fake `DriverContext` (same shape as `driver-stop-race.test.ts`) so the commit
 * subscription and timers are directly observable.
 */

interface RecordedTimer { atMs: number; cb: () => void; handle: number; cleared: boolean }

function makeFakeCtx(runFn: (path: string) => Promise<unknown>): {
  ctx: DriverContext;
  timers: RecordedTimer[];
  /** The most recent `onCommit` subscriber, so a test can deliver a commit by hand. */
  commit: (tables: string[]) => void;
} {
  const timers: RecordedTimer[] = [];
  let nextHandle = 1;
  let subscriber: ((inv: { tables: string[] }) => void) | null = null;
  const ctx: DriverContext = {
    runFunction: (path: string) => runFn(path),
    onCommit: (cb) => {
      subscriber = cb as (inv: { tables: string[] }) => void;
      return () => {
        subscriber = null;
      };
    },
    setTimer: (atMs: number, cb: () => void) => {
      const handle = nextHandle++;
      timers.push({ atMs, cb, handle, cleared: false });
      return handle;
    },
    clearTimer: (handle: number) => {
      const t = timers.find((x) => x.handle === handle);
      if (t) t.cleared = true;
    },
    now: () => 1000,
    backstopMs: (d: number) => d,
    readLog: async () => ({ changes: [], maxScannedTs: 0 }),
  };
  return { ctx, timers, commit: (tables) => subscriber?.({ tables }) };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe("schedulerDriver restart", () => {
  it("start() after stop() dispatches again: the initial pass runs, the sweep re-arms, and commit wakes work", async () => {
    let peekCalls = 0;
    const { ctx, timers, commit } = makeFakeCtx(async (path) => {
      if (path === "scheduler:_peekDue") {
        peekCalls++;
        return { due: [], earliestFutureTs: null };
      }
      return {};
    });

    const driver = schedulerDriver();
    driver.start(ctx);
    await settle();
    expect(peekCalls).toBe(1); // first life: start() ran its initial pass
    const sweepsBeforeStop = timers.filter((t) => !t.cleared).length;
    expect(sweepsBeforeStop).toBe(1); // and armed the reclaim sweep

    driver.stop?.();
    await settle();
    expect(timers.every((t) => t.cleared)).toBe(true); // stop() tore the sweep down

    // Second life on the same instance, as the fleet does on default-shard re-acquisition.
    driver.start(ctx);
    await settle();
    expect(peekCalls).toBe(2); // the restart's initial pass actually ran
    expect(timers.filter((t) => !t.cleared).length).toBe(1); // and the sweep is armed again

    // A scheduler-table commit after the restart must still wake a pass.
    commit(["scheduler/jobs"]);
    await settle();
    expect(peekCalls).toBe(3);

    driver.stop?.();
  });
});
