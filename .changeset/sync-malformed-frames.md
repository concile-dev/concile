---
"@concile/sync": patch
"@concile/cli": patch
"@concile/vite": patch
---

A malformed WebSocket frame no longer crashes the server. `parseClientMessage` now validates the
shape of every inbound client message and throws a `ProtocolError` for anything else; the handler
answers with a `FatalError` and closes only that session. The Node and Bun transports in
`concile dev`/`serve` and the Vite embed also catch any rejection from `handleMessage` and close
the offending connection, instead of leaving an unhandled rejection that exits the process.
