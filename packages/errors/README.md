# @concile/errors

The shared, structured error taxonomy for the Concile engine.

Every error the engine raises deliberately extends a common base class and carries a
stable machine-readable `code`, an HTTP status, and a `retryable` flag, and serializes
losslessly to JSON so it can cross the syscall boundary, the wire protocol, and the
client SDK without losing its identity. The taxonomy is split into a few families:
user errors (the caller's fault, not retryable), system errors (the engine's fault),
transient errors (safe to retry), and conflict errors (optimistic-concurrency write
conflicts).

Nearly every other engine package depends on this one, which is what keeps error
handling consistent from a function handler all the way out to a client.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
