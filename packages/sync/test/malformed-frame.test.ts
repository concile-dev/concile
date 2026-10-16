/**
 * Inbound frames come straight off an unauthenticated socket. A malformed one must cost only the
 * sending session (FatalError + close), never reject out of `handleMessage`: every Node/Bun
 * transport calls it fire-and-forget, so a rejection there is an unhandled rejection, which exits
 * the whole server process.
 */
import { describe, it, expect, vi } from "vitest";
import {
  SyncProtocolHandler,
  parseClientMessage,
  ProtocolError,
  type SyncUdfExecutor,
  type ServerMessage,
} from "../src/index";

const exec: SyncUdfExecutor = {
  async runQuery(path) {
    return { value: `user:${path}` as never, tables: ["t"], readRanges: [], globalTables: [] };
  },
  async runMutation() {
    return { value: "ok" as never, tables: ["t"], writeRanges: [], commitTs: 1 };
  },
  async runAdminQuery(path) {
    return { value: `admin:${path}` as never, tables: ["t"], readRanges: [], globalTables: [] };
  },
  async runAction(path) {
    return { value: `acted:${path}` as never };
  },
};

function sock() {
  const sent: ServerMessage[] = [];
  return { sent, send: (d: string) => sent.push(JSON.parse(d) as ServerMessage), bufferedAmount: 0, close: vi.fn() };
}

const MALFORMED = [
  "x",
  "",
  "null",
  "42",
  "[]",
  JSON.stringify({}),
  JSON.stringify({ type: "Nope" }),
  JSON.stringify({ type: "ModifyQuerySet" }),
  JSON.stringify({ type: "ModifyQuerySet", add: [null], remove: [] }),
  JSON.stringify({ type: "ModifyQuerySet", add: [{ queryId: "1", udfPath: "a:b", args: {} }], remove: [] }),
  JSON.stringify({ type: "ModifyQuerySet", add: [], remove: "1" }),
  JSON.stringify({ type: "Mutation", udfPath: "a:b", args: {} }),
  JSON.stringify({ type: "MutationBatch", entries: {} }),
  JSON.stringify({ type: "MutationBatch", entries: [{ requestId: 1, udfPath: "a:b", args: {} }] }),
  JSON.stringify({ type: "Action", requestId: "r" }),
  JSON.stringify({ type: "Connect", sessionId: 7 }),
  JSON.stringify({ type: "Connect", sessionId: "s", held: [{ clientId: "c" }] }),
  JSON.stringify({ type: "SetAuth" }),
  JSON.stringify({ type: "SetAdminAuth", key: 1 }),
  JSON.stringify({ type: "EphemeralPublish", event: {} }),
];

describe("malformed client frames", () => {
  it.each(MALFORMED)("%j: FatalError + close for that session, and handleMessage resolves", async (raw) => {
    const h = new SyncProtocolHandler(exec, { autoNotifyOnMutation: false });
    const bad = sock();
    const good = sock();
    h.connect("bad", bad as never);
    h.connect("good", good as never);

    await expect(h.handleMessage("bad", raw)).resolves.toBeUndefined();

    expect(bad.sent).toEqual([{ type: "FatalError", message: expect.stringMatching(/^malformed client message/) }]);
    expect(bad.close).toHaveBeenCalledTimes(1);
    await expect(h.handleMessage("bad", JSON.stringify({ type: "SetAuth", token: null }))).rejects.toThrow(/unknown session/);

    // Other sessions are untouched.
    await h.handleMessage("good", JSON.stringify({ type: "Mutation", requestId: "r1", udfPath: "app:mut", args: {} }));
    expect(good.close).not.toHaveBeenCalled();
    expect(good.sent.find((m) => m.type === "MutationResponse")).toMatchObject({ requestId: "r1", success: true });
  });
});

describe("parseClientMessage", () => {
  it("throws ProtocolError (not SyntaxError/TypeError) for malformed frames", () => {
    for (const raw of MALFORMED) expect(() => parseClientMessage(raw)).toThrow(ProtocolError);
  });

  it("accepts every well-formed message shape the client sends", () => {
    const valid = [
      { type: "Connect", sessionId: "s" },
      { type: "Connect", supportsQueryDiff: true },
      {
        type: "Connect",
        sessionId: "s",
        clientId: "c",
        held: [{ clientId: "c", seq: 1 }],
        ackedThrough: [{ clientId: "c", seq: 0 }],
        supportsQueryDiff: true,
      },
      { type: "ModifyQuerySet", add: [{ queryId: 1, udfPath: "a:b", args: {} }], remove: [2] },
      { type: "ModifyQuerySet", add: [{ queryId: 1, udfPath: "a:b", args: {}, resultHash: "h", sinceTs: 5 }], remove: [] },
      { type: "Mutation", requestId: "r", udfPath: "a:b", args: { x: 1 } },
      { type: "Mutation", requestId: "r", udfPath: "a:b", args: {}, clientId: "c", seq: 3 },
      { type: "MutationBatch", entries: [{ requestId: "r", udfPath: "a:b", args: {}, clientId: "c", seq: 1 }] },
      { type: "Action", requestId: "r", udfPath: "a:b", args: {} },
      { type: "EphemeralPublish", topic: "t", event: { x: 1 } },
      { type: "SetAuth", token: "tok" },
      { type: "SetAuth", token: null },
      { type: "SetAdminAuth", key: "k" },
    ];
    for (const msg of valid) expect(parseClientMessage(JSON.stringify(msg))).toEqual(msg);
  });
});
