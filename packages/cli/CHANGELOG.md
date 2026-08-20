# @concile/cli

## 0.1.5

### Patch Changes

- [#11](https://github.com/concile-dev/concile/pull/11) [`f171b07`](https://github.com/concile-dev/concile/commit/f171b07bb4cfb8ca76b3a0903ab0ed458354e281) Thanks [@dbjpanda](https://github.com/dbjpanda)! - `concile dev` output gets a proper terminal presentation on interactive
  terminals: a branded startup block with aligned URLs, a truncated admin key,
  a functions/tables/components summary, styled reload lines, and actionable
  multi-line error blocks. Piped/CI output (and `NO_COLOR`/`CONCILE_PLAIN`)
  stays byte-identical to the previous plain format.

- [#13](https://github.com/concile-dev/concile/pull/13) [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac) Thanks [@dbjpanda](https://github.com/dbjpanda)! - The terminal dashboard gains its remaining screens: logs (execution log with
  an errors-only filter), schema (tables, validator-typed fields, indexes,
  shard keys), and a function runner whose argument form is generated from each
  function's own `args` validators and executes through the admin API. Five
  screens now switch on the number keys.

- [#13](https://github.com/concile-dev/concile/pull/13) [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac) Thanks [@dbjpanda](https://github.com/dbjpanda)! - The terminal dashboard is now live: it subscribes to the engine's write fan-out,
  so a committed mutation repaints the visible table, row counts, metrics, and
  logs immediately — no polling, no manual refresh.

- [#13](https://github.com/concile-dev/concile/pull/13) [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac) Thanks [@dbjpanda](https://github.com/dbjpanda)! - The overview screen is redesigned around the numbers that matter: live client
  connections, active subscriptions, and uptime now come from a new admin stats
  surface, the latency histogram derives its buckets from the data instead of
  fixed guesses, duplicate visualizations are gone, and the activity feed is a
  bordered panel rather than floating text.

- [#13](https://github.com/concile-dev/concile/pull/13) [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac) Thanks [@dbjpanda](https://github.com/dbjpanda)! - The concile terminal dashboard (phase 1): a new `@concile/tui` package —
  OpenTUI-rendered, with vendored termcn components and the concile dark theme
  (the website's palette) — attaches automatically to `concile dev` on an
  interactive terminal under Bun. Ships the Overview screen (deployment facts,
  project summary, live reload activity) with `o` open-dashboard and `q` quit
  keys. Opt out with `--no-ui` or `CONCILE_TUI=0`; non-TTY, CI, and Node hosts
  keep the plain/styled output unchanged.
- Updated dependencies [[`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac), [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac)]:
  - @concile/executor@0.1.5
  - @concile/admin@0.1.5
  - @concile/sync@0.1.5
  - @concile/component@0.1.5
  - @concile/docstore-postgres@0.1.5
  - @concile/runtime-embedded@0.1.5
  - @concile/storage@0.1.5
  - @concile/deploy@0.1.5
  - @concile/receipts@0.1.5
  - @concile/dashboard@0.1.5
  - @concile/blobstore@0.1.5
  - @concile/blobstore-fs@0.1.5
  - @concile/blobstore-s3@0.1.5
  - @concile/codegen@0.1.5
  - @concile/docstore@0.1.5
  - @concile/docstore-sqlite@0.1.5
  - @concile/errors@0.1.5
  - @concile/id-codec@0.1.5
  - @concile/objectstore@0.1.5
  - @concile/objectstore-fs@0.1.5
  - @concile/objectstore-s3@0.1.5
  - @concile/query-engine@0.1.5
  - @concile/values@0.1.5

## 0.1.4

### Patch Changes

- [#7](https://github.com/concile-dev/concile/pull/7) [`c906588`](https://github.com/concile-dev/concile/commit/c90658831380d0a9f4717f0a9d34c4fffcc9a95e) Thanks [@dbjpanda](https://github.com/dbjpanda)! - `concile dev` hot reload now refreshes the admin API's function manifest and
  schema, so `GET /_admin/functions` and the dashboard's Functions list pick up
  newly added functions immediately instead of serving the boot-time catalog
  until restart. ([#1](https://github.com/concile-dev/concile/issues/1))
- Updated dependencies []:
  - @concile/dashboard@0.1.4
  - @concile/admin@0.1.4
  - @concile/blobstore@0.1.4
  - @concile/blobstore-fs@0.1.4
  - @concile/blobstore-s3@0.1.4
  - @concile/codegen@0.1.4
  - @concile/component@0.1.4
  - @concile/deploy@0.1.4
  - @concile/docstore@0.1.4
  - @concile/docstore-postgres@0.1.4
  - @concile/docstore-sqlite@0.1.4
  - @concile/errors@0.1.4
  - @concile/executor@0.1.4
  - @concile/id-codec@0.1.4
  - @concile/objectstore@0.1.4
  - @concile/objectstore-fs@0.1.4
  - @concile/objectstore-s3@0.1.4
  - @concile/query-engine@0.1.4
  - @concile/receipts@0.1.4
  - @concile/runtime-embedded@0.1.4
  - @concile/storage@0.1.4
  - @concile/sync@0.1.4
  - @concile/values@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @concile/docstore-postgres@0.1.3
  - @concile/dashboard@0.1.3
  - @concile/admin@0.1.3
  - @concile/blobstore@0.1.3
  - @concile/blobstore-fs@0.1.3
  - @concile/blobstore-s3@0.1.3
  - @concile/codegen@0.1.3
  - @concile/component@0.1.3
  - @concile/deploy@0.1.3
  - @concile/docstore@0.1.3
  - @concile/docstore-sqlite@0.1.3
  - @concile/errors@0.1.3
  - @concile/executor@0.1.3
  - @concile/id-codec@0.1.3
  - @concile/objectstore@0.1.3
  - @concile/objectstore-fs@0.1.3
  - @concile/objectstore-s3@0.1.3
  - @concile/query-engine@0.1.3
  - @concile/receipts@0.1.3
  - @concile/runtime-embedded@0.1.3
  - @concile/storage@0.1.3
  - @concile/sync@0.1.3
  - @concile/values@0.1.3
