# @concile/vite

Vite plugin for Concile: `vite` alone serves your frontend and the Concile backend on one browser origin — no manual proxy configuration, no CORS.

Unlike most Concile packages, this one is installed directly (it is not part of the umbrella `concile` package):

```sh
bun add -D @concile/vite   # or: npm install -D @concile/vite
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { concile } from "@concile/vite";

export default defineConfig({
  plugins: [concile()],
});
```

Run `vite` and the plugin brings the backend up alongside the dev server. `/api` (including the `/api/sync` WebSocket), `/_dashboard`, and `/_admin` are served from the same origin as your app.

## Modes

- `"proxy"` (default): spawns `concile dev` as a child process on a free port and proxies the engine-owned path prefixes to it. Uses Node builtins only; the `@concile/cli` peer dependency stays optional.
- `"embed"`: boots the engine inside Vite's own process as middleware plus a `/api/sync` WebSocket — no child process, no proxy hop. Requires `@concile/cli` to be installed; reached via `concile({ mode: "embed" })`.

## Options

- `mode` — `"proxy"` | `"embed"` (default `"proxy"`).
- `functionsDir` — app functions directory (default `"concile"`).
- Proxy mode: `port`, `command` (how to invoke the CLI), `args` (extra flags forwarded to `concile dev`).
- Embed mode: `dataPath` (SQLite file, default `<root>/.concile/dev.db`), `databaseUrl` (opt-in Postgres), `adminKey` (default: an ephemeral per-run key).

The child process is cleaned up when the Vite server closes or receives a signal.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs

License: FSL-1.1-Apache-2.0
