# @concile/component

The component-definition seam that Concile's opt-in components plug into.

This package provides `defineConfig` for a project's `concile.config.ts` and the
component contract itself: how a component declares its tables, functions, context
providers, boot steps, HTTP routes, and recurring drivers, and how `composeComponents`
merges a set of components (such as the scheduler, workflow, auth, or triggers
components) into one composed definition the runtime can boot. Drivers are the
reactive event loops woken by the engine's commit fan-out and a wall-clock timer,
which is how components like the scheduler run background work.

It sits between application configuration and the embedded runtime: the CLI resolves
`concile.config.ts` through this package, then hands the composed result to the engine.

> This is an internal package of the Concile engine. Most applications should install
> [`concile`](https://www.npmjs.com/package/concile) instead.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
