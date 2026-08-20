# @concile/objectstore-s3

The S3-compatible implementation of the Concile `ObjectStore` seam.

This adapter implements the object-storage contract defined by
`@concile/objectstore` against any S3-compatible service — AWS S3, MinIO,
Cloudflare R2, and similar. Immutable segment writes use create-only
conditional PUTs so a stale writer can never clobber a live object, and the
compare-and-swap put maps to server-side `If-Match`/`If-None-Match`
preconditions, making its CAS safe across processes — the property Concile's
multi-node object-storage tier depends on for its commit fence.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
