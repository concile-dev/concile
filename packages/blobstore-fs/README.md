# @concile/blobstore-fs

The filesystem implementation of the Concile `BlobStore` — the zero-config default for file storage.

This adapter implements the byte-storage seam defined by `@concile/blobstore`
on the local filesystem, keeping file bytes under the server's data directory
(`<data-dir>/storage`). Uploads are proxied: the client sends bytes to the
Concile server's own upload endpoint, which stores and finalizes them in one
round trip. It is the backend Concile uses whenever no object-storage bucket is
configured — nothing to set up for local development or single-node
self-hosting.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
