# @concile/executor

## 0.1.5

### Patch Changes

- [#13](https://github.com/concile-dev/concile/pull/13) [`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac) Thanks [@dbjpanda](https://github.com/dbjpanda)! - The in-memory execution log is now a true circular buffer (fixed array + head
  pointer) instead of an array with `shift()` on overflow, so `push` — which runs
  on every function call — stays O(1) once the 1000-entry buffer is full. `query`
  walks newest-first directly and short-circuits at `limit`, avoiding a full copy
  and reverse of the buffer on every read.
- Updated dependencies []:
  - @concile/docstore@0.1.5
  - @concile/docstore-d1@0.1.5
  - @concile/errors@0.1.5
  - @concile/id-codec@0.1.5
  - @concile/index-key-codec@0.1.5
  - @concile/query-engine@0.1.5
  - @concile/transactor@0.1.5
  - @concile/values@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @concile/docstore@0.1.4
  - @concile/docstore-d1@0.1.4
  - @concile/errors@0.1.4
  - @concile/id-codec@0.1.4
  - @concile/index-key-codec@0.1.4
  - @concile/query-engine@0.1.4
  - @concile/transactor@0.1.4
  - @concile/values@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @concile/docstore@0.1.3
  - @concile/docstore-d1@0.1.3
  - @concile/errors@0.1.3
  - @concile/id-codec@0.1.3
  - @concile/index-key-codec@0.1.3
  - @concile/query-engine@0.1.3
  - @concile/transactor@0.1.3
  - @concile/values@0.1.3
