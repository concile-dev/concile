---
"@concile/scheduler": patch
"@concile/notifications": patch
"@concile/triggers": patch
"@concile/storage": patch
"@concile/receipts": patch
"@concile/runtime-cloudflare": patch
"@concile/objectstore-substrate": patch
---

Fix drivers that could never restart after `stop()`.

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
