# @concile/storage

Concile's file-storage engine: the `_storage` system table and the `ctx.storage` API.

This package implements file storage on top of the `@concile/blobstore` seam.
It defines the reserved `_storage` system table (file ids are first-class typed
references that participate in reactivity like any other table), the
`ctx.storage` context provider available to queries, mutations, and actions,
two-phase uploads (proxied through the server for the filesystem backend,
presigned direct-to-bucket for object storage), private-by-default serving via
HMAC capability-token URLs with byte-range support, and a background reaper
that reclaims abandoned or deleted uploads. The byte backend is chosen by the
server at boot; this package never imports a storage driver directly.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
