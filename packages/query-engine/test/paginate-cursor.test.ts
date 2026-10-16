import { describe, it, expect } from "vitest";
import { SqliteDocStore, NodeSqliteAdapter } from "@concile/docstore-sqlite";
import {
  newDocumentId,
  encodeInternalDocumentId,
  encodeStorageIndexId,
  type InternalDocumentId,
} from "@concile/id-codec";
import type { DocumentValue, IndexWrite } from "@concile/docstore";
import { QueryRuntime, computeIndexUpdates, type IndexSpec, type Query } from "../src/index";

const TABLE = 7002;

const byOwner: IndexSpec = {
  table: "notes",
  tableNumber: TABLE,
  index: "by_owner",
  fields: ["owner"],
  indexId: encodeStorageIndexId(TABLE, "by_owner"),
};

function makeDoc(id: InternalDocumentId, creation: number, extra: Record<string, unknown>): DocumentValue {
  return { _id: encodeInternalDocumentId(id), _creationTime: creation, ...extra } as DocumentValue;
}

async function seed(): Promise<{ store: SqliteDocStore; qr: QueryRuntime }> {
  const store = new SqliteDocStore(new NodeSqliteAdapter());
  await store.setupSchema();
  let ts = 0n;
  for (const owner of ["alice", "alice", "bob", "bob", "carol", "carol"]) {
    ts++;
    const id = newDocumentId(TABLE);
    const doc = makeDoc(id, Number(ts), { owner });
    const indexWrites: IndexWrite[] = computeIndexUpdates([byOwner], null, doc, id).map((update) => ({ ts, update }));
    await store.write([{ ts, id, prev_ts: null, value: { id, value: doc } }], indexWrites, "Error");
  }
  return { store, qr: new QueryRuntime(store) };
}

const bobs = (order: "asc" | "desc"): Query => ({
  index: byOwner,
  range: [{ field: "owner", operator: "eq", value: "bob" }],
  order,
});

const owners = (page: DocumentValue[]): unknown[] => page.map((d) => (d as Record<string, unknown>).owner);

// Cursors are raw index-key bytes the client hands back; these are ones no real page ever minted.
const BEFORE_ALL = btoa("\x00");
const AFTER_ALL = btoa("\xff");

describe("paginate cursor stays inside the query's range", () => {
  it("asc: a cursor before the range restarts at the range, never reading rows below it", async () => {
    const { store, qr } = await seed();
    const res = await qr.paginate(bobs("asc"), await store.maxTimestamp(), { cursor: BEFORE_ALL, pageSize: 10 });
    expect(owners(res.page)).toEqual(["bob", "bob"]);
    expect(res.hasMore).toBe(false);
  });

  it("asc: a cursor past the range yields an empty final page", async () => {
    const { store, qr } = await seed();
    const res = await qr.paginate(bobs("asc"), await store.maxTimestamp(), { cursor: AFTER_ALL, pageSize: 10 });
    expect(res.page).toEqual([]);
    expect(res.hasMore).toBe(false);
  });

  it("desc: a cursor past the range restarts at the range, never reading rows above it", async () => {
    const { store, qr } = await seed();
    const res = await qr.paginate(bobs("desc"), await store.maxTimestamp(), { cursor: AFTER_ALL, pageSize: 10 });
    expect(owners(res.page)).toEqual(["bob", "bob"]);
    expect(res.hasMore).toBe(false);
  });

  it("desc: a cursor before the range yields an empty final page", async () => {
    const { store, qr } = await seed();
    const res = await qr.paginate(bobs("desc"), await store.maxTimestamp(), { cursor: BEFORE_ALL, pageSize: 10 });
    expect(res.page).toEqual([]);
    expect(res.hasMore).toBe(false);
  });

  it("a cursor minted by another owner's query cannot reach that owner's rows", async () => {
    const { store, qr } = await seed();
    const ts = await store.maxTimestamp();
    const alices: Query = { ...bobs("asc"), range: [{ field: "owner", operator: "eq", value: "alice" }] };
    const first = await qr.paginate(alices, ts, { pageSize: 1 });
    expect(first.nextCursor).not.toBeNull();

    const res = await qr.paginate(bobs("asc"), ts, { cursor: first.nextCursor, pageSize: 10 });
    expect(owners(res.page)).toEqual(["bob", "bob"]);
  });

  it("genuine cursors still page through the range in both orders", async () => {
    const { store, qr } = await seed();
    const ts = await store.maxTimestamp();
    for (const order of ["asc", "desc"] as const) {
      const p1 = await qr.paginate(bobs(order), ts, { pageSize: 1 });
      expect(owners(p1.page)).toEqual(["bob"]);
      expect(p1.hasMore).toBe(true);
      const p2 = await qr.paginate(bobs(order), ts, { cursor: p1.nextCursor, pageSize: 1 });
      expect(owners(p2.page)).toEqual(["bob"]);
      expect(p2.page[0]!._id).not.toBe(p1.page[0]!._id);
      expect(p2.hasMore).toBe(false);
    }
  });
});
