# @concile/docstore-sqlite

The SQLite implementation of the Concile `DocStore` — the zero-config default storage backend.

This adapter implements the MVCC document-log storage seam defined by
`@concile/docstore` on top of SQLite. It is the backend Concile uses out of the
box for local development and single-node deployments: no configuration, one
database file under the data directory. Under Bun it uses `bun:sqlite`; under
Node it uses the built-in `node:sqlite` driver, both behind a small
`DatabaseAdapter` interface so the store itself stays driver-agnostic.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
