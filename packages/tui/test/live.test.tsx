/* @jsxImportSource @opentui/react */
/**
 * The dashboard must be a reactive client of its own engine: a committed write
 * repaints the visible table without any user action and without polling.
 */
import { test, expect } from "bun:test";
import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import { App } from "../src/app";
import { renderUntil, containsAll } from "./render-until";

// renderUntil polls the frame instead of sleeping a fixed interval, which is
// what made this test machine-speed dependent.

test("a commit to the visible table repaints it live", async () => {
  const listeners = new Set<(t: string[], ts: number) => void>();
  let rows = [{ _id: "m1", author: "ada", body: "first message" }];
  let count = 1;

  const bridge = {
    deployment: {
      url: "http://127.0.0.1:3210",
      dashboardUrl: null,
      adminKeyPreview: "k…1",
      functionsDir: "concile",
      storage: "sqlite",
      version: "0.1.4",
    },
    counts: () => ({ functions: 1, tables: 1, components: 0 }),
    onEvent: () => () => {},
    requestQuit: () => {},
    data: {
      listTables: async () => [{ name: "messages", documentCount: count, indexes: [] }],
      getTableData: async () => ({ documents: rows, cursor: null, isDone: true }),
      listFunctions: () => [],
      runFunction: async () => ({ value: null, committed: true }),
      queryLogs: () => [],
      schema: () => ({ tables: {} }),
      onCommit: (cb: (t: string[], ts: number) => void) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const r = await createTestRenderer({ width: 100, height: 20 });
  createRoot(r.renderer).render(<App bridge={bridge} />);
  await renderUntil(r, (f) => f.includes("concile"), { label: "shell" });
  r.mockInput.pressKey("2");
  const opened = await renderUntil(r, (f) => f.includes("first message"), {
    label: "messages table",
  });
  expect(opened).not.toContain("second message");

  // A mutation commits, touching `messages` — no key press, no refresh.
  rows = [...rows, { _id: "m2", author: "grace", body: "second message" }];
  count = 2;
  for (const cb of listeners) cb(["messages"], 42);

  // No key press and no refresh: the row must arrive from the subscription
  // alone, so poll until it does rather than guessing how long that takes.
  const frame = await renderUntil(r, containsAll("second message", "2 rows"), {
    label: "live update",
  });
  expect(frame).toContain("second message"); // the new row appeared on its own
  expect(frame).toContain("2 rows"); // and the count updated
  r.renderer.destroy();
});
