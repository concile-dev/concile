# @concile/triggers

## 0.1.6

### Patch Changes

- [#23](https://github.com/concile-dev/concile/pull/23) [`1cb1a7c`](https://github.com/concile-dev/concile/commit/1cb1a7cae0ac5ce783db71184a620377ac1cc790) Thanks [@dbjpanda](https://github.com/dbjpanda)! - Fix drivers that could never restart after `stop()`.

  Every component driver carries a `stopped` guard so an in-flight pass cannot resurrect the loop after
  teardown. `stop()` set it and nothing cleared it, so a later `start()` on the same instance
  re-subscribed to commits and then ignored all of them: no dispatch, no sweep, no error logged.

  The fleet restarts drivers on the same instances. Drivers follow the default shard, so a node that
  released that shard stopped them, and if it later re-acquired the shard after a peer died, its
  scheduler, triggers, notifications and reapers came back dead. That is the intermittent fleet e2e
  failure "tick chain to resume on the survivor": which node was the survivor depended on rendezvous
  hashing over freshly chosen ports.

  `start()` now clears the guard. The runtime's own `driversStarted` flag was fixed for the same reason
  earlier; this is the same defect one layer down.

- Updated dependencies [[`1cb1a7c`](https://github.com/concile-dev/concile/commit/1cb1a7cae0ac5ce783db71184a620377ac1cc790)]:
  - @concile/scheduler@0.1.6
  - @concile/component@0.1.6
  - @concile/executor@0.1.6
  - @concile/values@0.1.6

## 0.1.5

### Patch Changes

- Updated dependencies [[`6e857cd`](https://github.com/concile-dev/concile/commit/6e857cd3338a8b9604ab1e4014740ab91567c6ac)]:
  - @concile/executor@0.1.5
  - @concile/scheduler@0.1.5
  - @concile/component@0.1.5
  - @concile/values@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @concile/component@0.1.4
  - @concile/executor@0.1.4
  - @concile/values@0.1.4
  - @concile/scheduler@0.1.4

## 0.1.3

### Patch Changes

- [#3](https://github.com/concile-dev/concile/pull/3) [`50fb88f`](https://github.com/concile-dev/concile/commit/50fb88fa4ac89adfcfcea040d3197c72a314353c) Thanks [@dbjpanda](https://github.com/dbjpanda)! - Republish every package through OIDC trusted publishing — the first release
  with no publish token anywhere; all packages gain provenance attestations.
- Updated dependencies [[`50fb88f`](https://github.com/concile-dev/concile/commit/50fb88fa4ac89adfcfcea040d3197c72a314353c)]:
  - @concile/scheduler@0.1.3
  - @concile/component@0.1.3
  - @concile/executor@0.1.3
  - @concile/values@0.1.3
