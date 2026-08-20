# @concile/dashboard

The Concile dashboard: a single-page web app for inspecting and operating a Concile deployment, served automatically by `concile dev` and `concile serve`.

This package is not for direct installation. It exists so the CLI can embed the built SPA (`@concile/cli` depends on it and serves the `dist/` output); end users get it by running the CLI — there is nothing to add to an app's dependencies.

## Usage

```sh
bunx concile dev
# open the printed URL and visit /_dashboard
```

In development the dashboard is served with the local admin key baked in. In production (`concile serve`) it is served key-less — the admin key is never embedded in the HTML — and the SPA prompts for `CONCILE_ADMIN_KEY` on first load.

## Features

- Live data browser: tables and documents update in real time over an admin sync subscription, with cursor pagination and structured filters.
- Logs viewer: function execution logs for queries, mutations, and actions.
- Function runner: call any query, mutation, or action with JSON arguments and inspect the result.
- Document editing through the admin HTTP API, with edits reflected immediately in the live view.

## Development

Within the monorepo:

```sh
bun run --filter @concile/dashboard dev     # Vite dev server
bun run --filter @concile/dashboard build   # build dist/ consumed by the CLI
```

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
