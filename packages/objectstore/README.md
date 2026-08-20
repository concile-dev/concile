# @concile/objectstore

The `ObjectStore` interface: Concile's object-storage seam for durable engine state.

This package defines the small contract Concile's storage/compute-separation
tier uses to keep durable state in an object store: immutable keep-first puts
for log segments, a conditional compare-and-swap put (the commit linearization
point, used for the manifest fence), etag-carrying reads, prefix listing, and
delete. Concrete implementations live in `@concile/objectstore-fs` and
`@concile/objectstore-s3`; the engine depends only on this interface. The
shared conformance suite and an in-memory reference store for tests also live
here.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
