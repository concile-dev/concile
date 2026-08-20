# @concile/blobstore-s3

The S3-compatible implementation of the Concile `BlobStore` file-storage seam.

This adapter stores file bytes in any S3-compatible bucket — AWS S3, MinIO,
Cloudflare R2, and similar services. Uploads are presigned: clients PUT bytes
directly to the bucket, bypassing the Concile server entirely, then confirm the
upload with the engine; downloads of private files redirect to short-lived
signed bucket URLs. It is selected by setting `CONCILE_STORAGE_BUCKET` (or the
`--storage-bucket` flag) on the server; when unset, Concile falls back to the
filesystem adapter.

> This is an internal package of the Concile engine. Most applications should install [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
