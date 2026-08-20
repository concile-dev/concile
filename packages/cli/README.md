# @concile/cli

The `concile` command-line tool: run, deploy, and build Concile apps — a local dev server with hot reload, a production server, push-based live deploys, single-binary compiles, data import/export, and typed codegen.

Most users should install the umbrella package [`concile`](https://www.npmjs.com/package/concile) instead — it bundles this CLI (the `concile` bin ships inside it) along with the server function helpers, the client SDK, and the React hooks.

```sh
bun add concile   # or: npm install concile
```

## Usage

```sh
# local development: watch concile/, hot-reload functions, serve the sync
# WebSocket + HTTP API + dashboard on one port
bunx concile dev

# production: requires CONCILE_ADMIN_KEY, binds 0.0.0.0, no codegen at boot
CONCILE_ADMIN_KEY=... bunx concile serve
```

## Commands

- `concile dev` — run the engine locally with hot reload and the dashboard.
- `concile serve` — run the production server (requires `CONCILE_ADMIN_KEY`, graceful shutdown on SIGTERM/SIGINT).
- `concile deploy` — deploy the app: `--target <serve|cloudflare|docker|railway|fly|aws>`, `--env <name>`, with `--dry-run` and `--check` modes. Deploying to a running `serve` hot-swaps functions and additive schema changes with no restart.
- `concile build` — compile the app and its components into a single self-contained executable (via `bun build --compile`), with cross-compile targets for Linux, macOS, and Windows.
- `concile migrate` — convert an existing project from another backend into a Concile project (rewrites imports, emits a divergence report). `migrate export` / `migrate import` move app data as a portable JSON dump between deployments.
- `concile codegen` — regenerate the typed `_generated/` output (typed `api`, `Doc`/`Id` types, `mintId`) for your functions directory.

Common options: `--port <n>`, `--ip <addr>`, `--dir <functionsDir>`, `--data <dbPath>`, `--database-url <url>` (Postgres; SQLite is the zero-config default).

## Features

- One-command local dev: functions, reactive sync, HTTP API, and dashboard on a single port.
- SQLite by default, Postgres via `--database-url` — no app-schema migrations either way.
- Live deploys to a running server (`serve --allow-deploy`), rejected if the schema change is destructive.
- Single-binary output that embeds the runtime, your functions, and the dashboard.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
