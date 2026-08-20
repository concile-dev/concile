# @concile/blobstore

The `BlobStore` interface: the byte-storage seam behind Concile's file storage.

This package defines the contract Concile's file-storage engine
(`@concile/storage`) uses to read and write actual file bytes — upload targets
(proxied or presigned), streamed store/read with byte-range support, signed
URLs, and metadata lookup. File metadata itself lives in the database; only the
bytes go through this seam. Concrete implementations live in sibling packages
such as `@concile/blobstore-fs`, `@concile/blobstore-s3`, and
`@concile/blobstore-r2`, and the engine never imports a storage driver
directly. The shared adapter conformance suite also lives here.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
