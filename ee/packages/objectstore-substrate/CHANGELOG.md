# @concile/objectstore-substrate

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

- Updated dependencies []:
  - @concile/component@0.1.6
  - @concile/docstore@0.1.6
  - @concile/docstore-sqlite@0.1.6
  - @concile/id-codec@0.1.6
  - @concile/index-key-codec@0.1.6
  - @concile/objectstore@0.1.6
  - @concile/values@0.1.6

## 0.1.5

### Patch Changes

- Updated dependencies []:
  - @concile/component@0.1.5
  - @concile/docstore@0.1.5
  - @concile/docstore-sqlite@0.1.5
  - @concile/id-codec@0.1.5
  - @concile/index-key-codec@0.1.5
  - @concile/objectstore@0.1.5
  - @concile/values@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @concile/component@0.1.4
  - @concile/docstore@0.1.4
  - @concile/docstore-sqlite@0.1.4
  - @concile/id-codec@0.1.4
  - @concile/index-key-codec@0.1.4
  - @concile/objectstore@0.1.4
  - @concile/values@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies []:
  - @concile/component@0.1.3
  - @concile/docstore@0.1.3
  - @concile/docstore-sqlite@0.1.3
  - @concile/id-codec@0.1.3
  - @concile/index-key-codec@0.1.3
  - @concile/objectstore@0.1.3
  - @concile/values@0.1.3
