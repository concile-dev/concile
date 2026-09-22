/* @jsxImportSource @opentui/react */
/**
 * The three interactive surfaces: row inspection, filtering, and the command
 * palette. Each is driven through real key events against the real render tree.
 */
import { test, expect } from "bun:test";
import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import { App } from "../src/app";
import { renderUntil } from "./render-until";

// Every wait below polls the rendered frame. The fixed setTimeout this
// replaces was a guess about machine speed: it held locally and expired on CI
// before the async table load had painted.

let lastFilter: unknown = null;

function makeBridge() {
  lastFilter = null;
  return {
    deployment: {
      url: "http://127.0.0.1:3210",
      dashboardUrl: null,
      adminKeyPreview: "k…1",
      functionsDir: "concile",
      storage: "sqlite",
      version: "0.1.4",
    },
    counts: () => ({ functions: 2, tables: 2, components: 0 }),
    onEvent: () => () => {},
    requestQuit: () => {},
    data: {
      listTables: async () => [
        { name: "messages", documentCount: 2, indexes: [] },
        { name: "conversations", documentCount: 1, indexes: [] },
      ],
      getTableData: async (_t: string, o?: { filter?: unknown }) => {
        lastFilter = o?.filter ?? null;
        return {
          documents: [
            { _id: "m1", author: "ada", body: "first message here" },
            { _id: "m2", author: "grace", body: "second message here" },
          ],
          cursor: null,
          isDone: true,
        };
      },
      listFunctions: () => [{ path: "messages:send", kind: "mutation" }],
      runFunction: async () => ({ value: null, committed: true }),
      queryLogs: () => [],
      schema: () => ({ tables: {} }),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

async function boot(width = 110, height = 24) {
  const r = await createTestRenderer({ width, height });
  createRoot(r.renderer).render(<App bridge={makeBridge()} />);
  await renderUntil(r, (f) => f.includes("quit"), { label: "shell" });
  return r;
}

/** Render until `want` holds, so each key press lands on a settled screen. */
async function step(
  r: Awaited<ReturnType<typeof boot>>,
  want: (frame: string) => boolean,
  label: string,
) {
  return renderUntil(r, want, { label });
}

const openMessages = (f: string) => f.includes("first message here");

test("⏎ inspects the selected row, J/K moves it, esc closes", async () => {
  const r = await boot();
  r.mockInput.pressKey("2");
  await step(r, openMessages, "messages table");

  r.mockInput.pressEnter();
  let frame = await step(r, (f) => f.includes("document 1/2"), "inspector open");
  expect(frame).toContain("document 1/2");
  expect(frame).toContain("first message here");

  r.mockInput.pressKey("J");
  frame = await step(r, (f) => f.includes("document 2/2"), "inspector moved");
  expect(frame).toContain("document 2/2");
  expect(frame).toContain("grace");

  r.mockInput.pressEscape();
  const closed = await step(r, (f) => !f.includes("document 2/2"), "inspector closed");
  expect(closed).not.toContain("document 2/2");
  r.renderer.destroy();
});

test("f enters a filter and ⏎ sends it to the server as an equality condition", async () => {
  const r = await boot();
  r.mockInput.pressKey("2");
  await step(r, openMessages, "messages table");

  r.mockInput.pressKey("f");
  await step(r, (f) => f.includes("filter:"), "filter prompt");
  r.mockInput.typeText("author=ada");
  const typed = await step(r, (f) => f.includes("filter: author=ada"), "filter typed");
  expect(typed).toContain("filter: author=ada");

  r.mockInput.pressEnter();
  // The condition reaches the bridge, not the screen, so wait on that instead.
  await step(r, () => Array.isArray(lastFilter) && lastFilter.length > 0, "filter sent");
  expect(lastFilter).toEqual([{ field: "author", op: "eq", value: "ada" }]);
  r.renderer.destroy();
});

test(": opens the palette, fuzzy-matches, and ⏎ jumps to the chosen table", async () => {
  const r = await boot();
  r.mockInput.typeText(":");
  const palette = await step(r, (f) => f.includes("screen"), "palette open");
  expect(palette).toContain("screen");

  r.mockInput.typeText("conv");
  const frame = await step(r, (f) => f.includes("conversations"), "palette filtered");
  expect(frame).toContain("conversations");

  r.mockInput.pressEnter();
  const after = await step(
    r,
    (f) => !f.includes(" ⏎ go · esc cancel") && f.includes("conversations"),
    "palette closed",
  );
  expect(after).not.toContain(" ⏎ go · esc cancel"); // palette closed
  expect(after).toContain("conversations");
  r.renderer.destroy();
});
