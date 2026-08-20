# @concile/deploy

The deploy-target seam behind `concile deploy --target`.

This package defines the common deploy contract and ships the built-in targets:
`serve` (live push to a running Concile server), `cloudflare`, `docker`, `railway`,
`fly`, and `aws`. Each target knows how to package a project's functions and get them
onto its platform; the CLI resolves the requested target through this package's
registry and drives it with a shared spawner, so provider-specific logic stays out of
the engine and the CLI alike.

It also contains supporting machinery such as module hashing for delta pushes and
configuration reconciliation for targets that manage platform config files.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
