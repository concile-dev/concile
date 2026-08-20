# @concile/docstore

The `DocStore` interface: the storage seam every Concile database adapter implements.

This package defines the contract between the Concile engine and its persistence
layer — an append-only MVCC document log with index writes, commit units, commit
guards, and a monotonic timestamp oracle. The engine only ever talks to this
interface; concrete implementations live in sibling packages such as
`@concile/docstore-sqlite` and `@concile/docstore-postgres`, so engine logic
never depends on a specific database driver. It also ships the shared
conformance suite that every adapter is tested against.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
