# @concile/query-engine

The read side of the Concile engine: index range scans, filters, ordering, and cursor
pagination over the document log.

This package turns a query built in application code into an index range scan,
applies post-filters and ordering, and returns results with stable cursors for
pagination. While doing so it records exactly which index ranges were read — the read
set — which the sync tier later intersects with committed write sets to decide which
subscriptions to re-run. It also computes the index updates a write implies, keeping
indexes consistent as documents change.

It pairs with the transactor's write side to close the reactive loop: precise read
sets from here, precise write sets from there, and an intersection between them is
what triggers a live update.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
