# @concile/blobstore-r2

The Cloudflare R2 implementation of the Concile `BlobStore` file-storage seam.

This adapter stores file bytes in a Cloudflare R2 bucket through the native R2
binding available to Workers and Durable Objects, rather than over the
S3-compatible HTTP API. It exists for Concile's Cloudflare deployment path,
where the engine runs inside a Durable Object and talks to R2 in-platform. For
deployments outside Cloudflare (or when reaching R2 over its S3 endpoint), use
`@concile/blobstore-s3` instead.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
