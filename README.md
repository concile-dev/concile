<div align="center">
  <img src=".github/assets/hero.svg" alt="Concile, the backend that keeps your data alive" width="100%" />
</div>

<div align="center">

[![npm](https://img.shields.io/npm/v/concile?color=22d3ee&label=concile&logo=npm)](https://www.npmjs.com/package/concile)
[![license](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-6366f1)](LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/concile-dev/concile/ci.yml?branch=main&label=CI)](https://github.com/concile-dev/concile/actions)
[![stars](https://img.shields.io/github/stars/concile-dev/concile?style=flat&color=eab308)](https://github.com/concile-dev/concile/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e)](CONTRIBUTING.md)

**Write a function. Watch your whole app come alive.**

Concile is the open-source backend where your data updates itself. No servers to wire. No APIs to glue. No refresh button to press.

</div>

---

## Building a backend is too hard. Let us fix that.

You have an idea. Between that idea and a real app stands a wall. Most of that wall was never your idea. It was plumbing.

**Concile removes the plumbing.**

| The old way 😩 | With Concile ✨ |
| :-- | :-- |
| Run and babysit a database | An embedded database, already running |
| Keep a server alive | One command: `npx concile dev` |
| Design and version an API | Call your function by name, fully typed |
| Open a socket for live updates | Every screen updates on its own |
| Add a cache, then clear it | Nothing to cache, nothing to invalidate |
| Write a thousand lines of glue | Write one function in plain TypeScript |
| It breaks the moment you look away | Change a function, everything stays in sync |

You write one function in plain TypeScript. Concile runs it on the server, safely, inside a transaction. When the data behind it changes, every screen watching that data updates on its own. A new message. A new order. Anything.

No polling. No refresh. No glue. Your app is simply, always, alive.

> Do not ask how much you must build to serve your data. Ask what your data can do the instant it changes.

---

## See the magic in ten lines

On the server. One file, plain functions:

```ts
// concile/tasks.ts
import { query, mutation } from "./_generated/server";

export const list = query(async (ctx) => ctx.db.query("tasks").collect());

export const add = mutation(async (ctx, { text }) => {
  await ctx.db.insert("tasks", { text, done: false });
});
```

In the browser. One hook, and it stays live:

```tsx
// App.tsx
const tasks = useQuery(api.tasks.list);
// Call add() from any device on Earth. This list re-renders here. Instantly.
```

That is it. There is no step three.

You never wrote a socket. You never wrote an endpoint. You never wrote a poller or a cache. Yet every browser, on every device, stays in perfect sync. That is the whole promise of Concile. And it is real today.

---

## Start in one minute

```bash
npm i concile        # or: bun add concile
npx concile dev      # watches your functions, serves live sync and a dashboard
```

Open the dashboard. Add a row. Watch it appear in your app before your finger leaves the key.

Ready for the world?

```bash
docker compose up    # one container, one volume, zero config
```

---

## What you get

- ⚡ **Real reactivity, not polling.** A write only re-runs the queries whose data it actually touched. You get milliseconds, not seconds.
- 🧠 **Just TypeScript.** Queries, mutations, actions for side effects, and HTTP routes for webhooks. No YAML. No ORM. No REST boilerplate. Fully typed, end to end.
- 🗄️ **A database in the box.** Embedded SQLite by default, zero config. Switch to Postgres with one flag when you grow. Same code, no migrations.
- 📦 **Files, auth, and jobs built in.** File storage on disk or S3/R2. Opt-in components for auth, authorization, a durable scheduler (cron and retries), and durable workflows.
- 🖥️ **A live dashboard.** Browse your data as it changes. Tail your logs. Run functions by hand. It ships in the box.
- 🏠 **Yours to host.** Run `docker compose up`, or compile the whole app into a single binary. It runs on a $5 server.

---

## It is fast, and we can prove it

We do not ask you to trust us on speed.

One container with 1 vCPU and 512 MB serves 2,000 live subscribers at about 12% CPU. Hot pushes land in about 102 ms. Each connection costs about 21 KB of memory.

These numbers are measured, not guessed. A benchmark suite boots this repo's own Docker image under strict limits. Nodes also scale out sideways, with proven isolation and about 15 ms between them. [See the numbers.](benchmarks/docs/docker-fleet-findings.md)

---

## Coming from Convex?

Concile speaks Convex's dialect. Same value system. Same validators. The same query, mutation, and action shape. Your instincts carry over, and a codemod moves most of your app.

But Concile is its own project. Its own roadmap. Its own home. We keep the door open for you. We do not live in that house.

---

## Your data. Your server. Forever.

Concile uses the [FSL-1.1-Apache-2.0](LICENSE) license. You can use it, change it, and self-host it, including for commercial work. There is one rule: you cannot resell Concile itself as a hosted service. Every release turns into full Apache 2.0 after two years. Self-hosting on a single node is free, always. No vendor. No lock-in. No rug to pull.

---

## Join us

Concile is pre-1.0, and it works today, end to end. The reactive engine and the production tooling are built and tested on both Node and Bun. The distributed tier and search come next.

We are building the backend we always wished existed. Strong enough for the expert. Simple enough that someone who has never heard the word "backend" can ship a living app this afternoon.

If you want that future, there is one thing you can do right now.

**⭐ Star the repo. Plant your flag. [Build something alive.](https://concile.dev)**

<div align="center">

**[Documentation](https://concile.dev/docs)** · **[Quickstart](https://concile.dev/docs/get-started)** · **[Contributing](CONTRIBUTING.md)** · **[Architecture](docs/contributing/architecture/)**

</div>
