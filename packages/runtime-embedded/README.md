# @concile/runtime-embedded

Composes storage, transactor, executor, and sync into one embeddable Concile runtime.

This package is the single-process engine core: it wires the document store, the
transactor, the function executor, and the reactive sync tier together, boots any
composed components and their background drivers, and drives the write fan-out that
wakes subscriptions after each commit. It exposes in-memory loopback connections so a
client can talk to the engine without a network hop, alongside the WebSocket path.

`concile dev`, `concile serve`, and the single-binary build produced by
`concile build` all boot their engine through this package, so every entrypoint runs
the same runtime with the same behavior.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
