# @concile/docstore-postgres

The PostgreSQL implementation of the Concile `DocStore` storage seam.

This adapter runs the same MVCC document log as the SQLite backend on top of
Postgres. It is physically schemaless — application tables and fields live as
data inside a small fixed set of internal tables, so evolving your schema never
requires a migration. A Postgres advisory lock enforces the single-writer
invariant (a second engine against the same database fails fast), and paginated
reads use streaming index scans that stop as soon as the caller does. It is
selected by passing `--database-url` to `concile serve` or setting
`CONCILE_DATABASE_URL`; both the native Bun SQL client and the `pg` driver are
supported behind a narrow client seam.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
