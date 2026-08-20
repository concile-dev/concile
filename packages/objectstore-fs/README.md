# @concile/objectstore-fs

The filesystem implementation of the Concile `ObjectStore` seam.

This adapter implements the object-storage contract defined by
`@concile/objectstore` on a local directory: immutable segment writes,
content-hash etags, prefix listing, and a compare-and-swap put guarded by an
in-process mutex. Because its CAS is process-local, it is intended for
development, testing, and single-process deployments; multi-writer deployments
need a store with server-side conditional writes, such as
`@concile/objectstore-s3`.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
