# @concile/executor

Runs Concile's query, mutation, action, and HTTP action functions.

This package is the function runtime: it executes user-defined functions through a
fully serializable syscall interface (a host/guest split, designed so guests can later
be sandboxed in isolates), enforces a determinism profile per function type, and
records the read and write sets that drive reactive invalidation. It validates
arguments against a function's declared validators and written documents against the
schema, so a wrong-typed call or write is rejected with a structured error before it
can commit.

Queries and mutations run deterministically with no access to the network or clock;
actions and HTTP actions run outside the transaction with native side effects. The
transactor calls into this package to execute a function inside each transaction.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
