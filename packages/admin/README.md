# @concile/admin

Admin API for the Concile engine, used by the built-in dashboard.

This package implements the authenticated admin surface a running deployment exposes
alongside the regular sync protocol: live table-browse subscriptions with cursor
pagination and structured filters, a log stream for the logs viewer, system functions,
and the function runner. It plugs into the engine's HTTP server as an admin router and
authenticates every request against the deployment admin key.

It exists so the dashboard (and any other operator tooling) can observe and drive a
deployment through one well-defined boundary instead of reaching into engine internals.
Browse results are delivered through the same reactive subscription machinery as
application queries, so the data browser updates live as documents change.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
