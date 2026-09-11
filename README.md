<div align="center">
  <img src=".github/assets/hero.svg" alt="Concile — the backend that keeps your data alive" width="100%" />
</div>

<div align="center">

[![npm](https://img.shields.io/npm/v/concile?color=22d3ee&label=concile&logo=npm)](https://www.npmjs.com/package/concile)
[![license](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-6366f1)](LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/concile-dev/concile/ci.yml?branch=main&label=CI)](https://github.com/concile-dev/concile/actions)
[![stars](https://img.shields.io/github/stars/concile-dev/concile?style=flat&color=eab308)](https://github.com/concile-dev/concile/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e)](CONTRIBUTING.md)

**Write a function. Watch your whole app come alive.**

Concile is the open-source backend where your data updates itself — no servers to wire, no APIs to glue, no refresh button to press.

</div>

---

## We build backends the hard way — so let us stop

For sixty years, software has asked the same toll at the same gate. You arrive with an idea. Between that idea and a living app stands a wall: a database to run, a server to keep breathing, an API to design, a socket to open, a cache to invalidate, and a thousand lines of glue that rot the moment you look away.

Most of the work was never the idea. It was the plumbing.

**Concile tears down the wall.**

You write one ordinary function — plain TypeScript. Concile runs it on the server, safely, inside a transaction. And the moment the data behind it changes — a new message, a new order, a new *anything* — every screen watching that data redraws itself, instantly, over a live connection.

No polling. No refresh. No glue. Your app is simply, always, **alive**.

> Ask not how much you must build to serve your data — ask what your data can do the instant it changes.

---

## See the magic in ten lines

**On the server** — one file, plain functions:

```ts
// concile/tasks.ts
import { query, mutation } from "./_generated/server";

export const list = query(async (ctx) => ctx.db.query("tasks").collect());

export const add  = mutation(async (ctx, { text }) => {
  await ctx.db.insert("tasks", { text, done: false });
});
```

**In the browser** — one hook, and it's *live forever*:

```tsx
// App.tsx
const tasks = useQuery(api.tasks.list);   // ← call add() from any device, on Earth,
                                          //   and this list re-renders here. Instantly.
```

That's it. There is no step three. You never wrote a socket, an endpoint, a poller, or a cache — and yet every browser, on every device, stays in perfect sync. That is the whole promise of Concile, and it is real today.

---

## Start in one minute

```bash
npm i concile        # or: bun add concile
npx concile dev      # watches your functions, serves live sync + a dashboard
```

Open the dashboard, add a row, and watch it appear in your app before your finger leaves the key. When you're ready for the world:

```bash
docker compose up    # your whole backend — one container, one volume, zero config
```

---

## What you get

- ⚡ **Reactivity that isn't polling.** A write only re-runs the queries whose exact data it touched — range-precise, not "refetch everything." Milliseconds, not seconds.
- 🧠 **Just TypeScript.** Queries, mutations, `action`s for side effects, and `httpAction` routes for webhooks. No YAML, no ORM, no REST boilerplate. Fully typed end to end, generated for you.
- 🗄️ **A database that comes in the box.** Embedded SQLite by default — zero config. Point at **Postgres** with one flag when you outgrow it. Same code, no migrations.
- 📦 **Files, auth, jobs — built in.** File storage (filesystem or S3/R2), plus opt-in components for **auth**, **authz**, a durable **scheduler** (cron + retries), and **workflows** (durable multi-step with saga/compensation).
- 🖥️ **A live dashboard.** Browse data as it changes, tail logs, and run functions by hand — shipped, not sold.
- 🏠 **Yours to host.** `docker compose up`, or compile the entire app into **a single binary**. Runs on a $5 VPS.

---

## Blazing fast — and we can prove it

We don't ask you to take performance on faith. A single **1-vCPU / 512 MB container serves 2,000 live subscribers at ~12% CPU** — ~102 ms hot-push median, ~21 KB of memory per connection — measured by a benchmark suite that boots this repo's own Docker image under enforced budgets. Nodes scale out horizontally with proven isolation and ~15 ms cross-node propagation. [See the numbers →](benchmarks/docs/docker-fleet-findings.md)

---

## Coming from Convex?

Concile speaks Convex's dialect — the same value system, validators, and `query`/`mutation`/`action` shape — so your instincts carry over and much of your app moves with a codemod. But make no mistake: **Concile is its own project, with its own roadmap and its own home.** Compatibility is a door we hold open, not the house we live in.

---

## Your data. Your server. Forever.

Concile is **[FSL-1.1-Apache-2.0](LICENSE)**: free to use, modify, and self-host — including commercially — with one rule (you can't resell Concile itself as a hosted service). Every release turns into full **Apache 2.0 after two years**. Single-node self-hosting and deploy-anywhere are free, always. No vendor. No lock-in. No rug to pull.

---

## The invitation

Concile is **pre-1.0, and working end to end** — the reactive engine and production tooling are built and tested on both Node and Bun today. The distributed tier and search are on the horizon.

We are building the backend we always wished existed: powerful for the veteran, and gentle enough that someone who has never heard the word "backend" can ship a living app this afternoon. If that is a future you want to live in, there is one thing you can do right now.

**⭐ Star the repo — plant your flag — and [build something alive](https://concile.dev).**

<div align="center">

**[Documentation](https://concile.dev/docs)** · **[Quickstart](https://concile.dev/docs/get-started)** · **[Contributing](CONTRIBUTING.md)** · **[Architecture](website/content/docs/contributing/architecture/)**

</div>
