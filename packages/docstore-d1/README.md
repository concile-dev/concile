# @concile/docstore-d1

The Cloudflare D1 adapter backing Concile's `.global()` tables.

Unlike the MVCC-log adapters, this store is relational: each global table maps
to a real D1 table with one column per field, real unique indexes, and a JSON
column type for nested values. It is used by Concile's Cloudflare deployment
path to give `.global()` tables a single strongly-consistent home (with
cross-shard read-your-writes and global unique constraints) alongside the
per-shard document stores. It ships the D1 client seam, DDL generation, and the
document-to-row codec.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
