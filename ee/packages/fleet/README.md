# @concile/fleet

Multi-node fleet mode for Concile: run several `concile serve` nodes against one Postgres database, with a lease-elected writer, read/sync nodes serving from embedded replicas, and sharded write scale-out.

## License

Source-available under the Concile Commercial License (see the LICENSE file in this package). In the current phase it is free to use in production — no license key is required. It may not be copied, modified, or distributed as part of a product or service that competes with Concile, and it does not convert to an open-source license.

## What it provides

- **Lease-based writer election with live failover.** Nodes boot symmetrically; a Postgres lease decides which node is the writer. If the writer dies or wedges, a sync node acquires the expired lease and promotes itself — no manual intervention. The failover clock scales from a single lease-TTL knob (`CONCILE_FLEET_LEASE_TTL_MS`, default 15000 ms).
- **Sync/read nodes with embedded replicas.** Non-writer nodes tail the commit log into a local SQLite replica and serve queries and reactive subscriptions from it, forwarding mutations to the current writer with read-your-own-writes catch-up.
- **Group commit.** Batches concurrent commits into fewer Postgres flushes for higher write throughput (enabled via `CONCILE_GROUP_COMMIT`).
- **Sharded write scale-out.** Writes are partitioned across per-shard leases (shard count from `CONCILE_FLEET_SHARDS`, persisted at first boot and immutable after), with a balancer distributing shard ownership across nodes and an offline reshard path (`reshardFleet`) for changing the count on a stopped deployment.
- **Fencing.** A node that loses its lease fails closed (`FencedError`) rather than continuing to write.

## Usage

Install alongside `concile` in the project you deploy:

```sh
bun add concile @concile/fleet
```

Fleet mode is activated per node by `concile serve --fleet`. The CLI has no static dependency on this package — when `--fleet` is passed it loads `@concile/fleet` via dynamic import at runtime and fails fast with an actionable message if the package is not installed.

Each fleet node needs a Postgres URL and the URL other nodes can reach it at:

```sh
concile serve --fleet \
  --database-url postgres://user:pass@db-host:5432/concile \
  --advertise-url http://this-node:3000
```

`CONCILE_FLEET=1`, `CONCILE_DATABASE_URL`, and env equivalents of the flags are also honored (flags win). Start additional nodes with the same `--database-url` and their own `--advertise-url`; roles (writer vs sync) are decided at boot and re-decided on failover.

Part of [Concile](https://github.com/concile-dev/concile) — docs at https://concile-six.vercel.app/docs
