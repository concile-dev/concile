<div align="center">
  <img src=".github/assets/hero.svg" alt="Concile. Your entire backend. Realtime by default." width="100%" />
</div>

<div align="center">

[![npm](https://img.shields.io/npm/v/concile?color=22d3ee&label=concile&logo=npm)](https://www.npmjs.com/package/concile)
[![license](https://img.shields.io/badge/license-FSL--1.1--Apache--2.0-6366f1)](LICENSE)
[![build](https://img.shields.io/github/actions/workflow/status/concile-dev/concile/ci.yml?branch=main&label=CI)](https://github.com/concile-dev/concile/actions)
[![stars](https://img.shields.io/github/stars/concile-dev/concile?style=flat&color=eab308)](https://github.com/concile-dev/concile/stargazers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e)](CONTRIBUTING.md)

**Write a function. Watch your whole app come alive.**

Concile is the open source backend that updates your data automatically. You don't have to wire up servers, glue together APIs, or ask your users to hit refresh.

</div>

***

## Building a backend shouldn't be this hard

You have a great idea for an app. But between that idea and shipping it, you have to deal with a mountain of plumbing. And let's be honest, you didn't start this project to write boilerplate.

**Concile gets rid of the plumbing.**

| The old way 😩 | With Concile ✨ |
| :-- | :-- |
| Run and babysit a database | You get an embedded database that's already running |
| Keep a server alive | Just type `npx concile dev` |
| Design and version an API | Just call your TypeScript function by its name |
| Open a socket for live updates | Every screen just updates on its own |
| Add a cache, then clear it | There is nothing to cache and nothing to invalidate |
| Write a thousand lines of glue | You just write one plain TypeScript function |
| It breaks the moment you look away | You change a function, and everything stays in sync |

You write a single function in plain TypeScript. Concile runs it safely on the server inside a transaction. Whenever the data behind that function changes, every screen currently looking at that data updates immediately. A new message, a new order, or a status change just appears on the screen.

No polling. No manual refreshing. No glue code. Your app just stays alive.

***

## See it in ten lines of code

On the server, you just write plain functions in one file:

```ts
// concile/tasks.ts
import { query, mutation } from "./_generated/server";

export const list = query(async (ctx) => ctx.db.query("tasks").collect());

export const add = mutation(async (ctx, { text }) => {
  await ctx.db.insert("tasks", { text, done: false });
});
```

In the browser, you use one hook and it stays live:

```tsx
// App.tsx
const tasks = useQuery(api.tasks.list);
// If someone calls add() from any device anywhere in the world, this list re-renders here instantly.
```

That is literally it. There is no step three.

You didn't have to write a websocket server. You didn't write a REST endpoint. You didn't set up polling or a caching layer. Yet every browser on every device stays in perfect sync. That is the core promise of Concile, and it works today.

***

## Get started in one minute

```bash
npm i concile        # or: bun add concile
npx concile dev      # watches your functions, serves live sync, and boots a dashboard
```

Open up the dashboard and add a row. Watch it appear in your app before your finger even leaves the keyboard.

Ready to share it with the world?

```bash
docker compose up    # one container, one volume, zero configuration needed
```

***

## What you get out of the box

* ⚡ **Real reactivity instead of polling.** When a write happens, we only re-run the queries that actually touched that specific data. Updates take milliseconds, not seconds.
* 🧠 **Just TypeScript.** Write queries, mutations, actions for side effects, and HTTP routes for webhooks. No YAML, no ORM, no REST boilerplate. It is fully typed from end to end.
* 🗄️ **A database built right in.** We use an embedded SQLite database by default so there is zero config. When you need to grow, switch to Postgres with a single flag. You keep the same code and run zero migrations.
* 📦 **Files, auth, and jobs included.** You get file storage on disk or S3/R2. We also include opt-in packages for auth, authorization, a durable scheduler for crons and retries, and durable workflows.
* 🖥️ **A live dashboard.** You can browse your data as it changes, tail your logs, and run functions manually. It ships right in the box.
* 🏠 **Yours to host.** You can run `docker compose up` or compile your whole app into a single binary. It will happily run on a $5 server.

***

## It is genuinely fast

We don't expect you to just take our word for it.

A single container with 1 vCPU and 512 MB of RAM can serve 2,000 live subscribers while only using about 12% of its CPU. Hot pushes land in roughly 102 milliseconds, and each connection only costs about 21 KB of memory.

We didn't guess these numbers. We built a strict benchmark suite that boots our own Docker image under heavy limits to measure them. Nodes can also scale out sideways with proven isolation and about 15 milliseconds of latency between them. [See the numbers for yourself.](benchmarks/docs/docker-fleet-findings.md)

***

## Coming over from Convex?

Concile actually speaks the Convex dialect. We share the same value system, the same validators, and the same shapes for queries, mutations, and actions. Your instincts will carry right over, and a simple codemod can move most of your app.

But Concile is its own distinct project with its own roadmap and its own home. We keep the door open for you, but we are building our own house.

***

## Your data, your server, forever

Concile uses the [FSL-1.1-Apache-2.0](LICENSE) license. You can use it, modify it, and self-host it, and yes, that includes commercial work. There is really only one rule: you cannot resell Concile itself as a hosted service. Every release automatically converts to a full Apache 2.0 license after two years. Self-hosting on a single node is always free. There is no vendor lock-in and no rug to pull.

***

## Join the project

Concile is currently pre-1.0, but it works end to end today. The reactive engine and production tooling are already built and tested on both Node and Bun. The distributed tier and search features are up next.

We are building the backend we always wished existed. It is strong enough for experts, but simple enough that someone who has never even heard the word "backend" can ship a living app this afternoon.

If you want to see that future happen, there is one thing you can do right now.

**⭐ Star the repo. Plant your flag. [Build something alive.](https://concile.dev)**

<div align="center">

**[Documentation](https://concile.dev/docs)** · **[Quickstart](https://concile.dev/docs/get-started)** · **[Contributing](CONTRIBUTING.md)** · **[Architecture](docs/contributing/architecture/)**

</div>
