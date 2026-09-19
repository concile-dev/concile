import Link from 'next/link';
import type { ReactNode } from 'react';

// The architectural differentiators, one numbered row each. These are not
// features (FeatureCards covers those) and not components (Components covers
// those). They are properties of the system that the alternatives structurally
// cannot copy, so each one gets a row of its own rather than a tile in a grid.
//
// Every claim is sourced from the docs. The `source` field names the page, so a
// doc rewrite has an obvious place to check.
type Pillar = {
  n: string;
  k: string;
  title: string;
  body: ReactNode;
  href: string;
  cta: string;
  evidence: ReactNode;
};

function Chips({ items }: { items: { label: string; note?: string }[] }) {
  return (
    <ul className="plr-chips">
      {items.map((it) => (
        <li key={it.label}>
          <b>{it.label}</b>
          {it.note && <span>{it.note}</span>}
        </li>
      ))}
    </ul>
  );
}

const PILLARS: Pillar[] = [
  {
    n: '01',
    k: 'offline first',
    title: 'It keeps working with no network',
    // source: docs/client/offline-sync
    body: (
      <>
        Writes you make on a plane go into a durable queue on the device. Close the tab, crash the
        browser, reload a day later. They are still there, and they drain in order the moment you
        reconnect. The server keeps a receipt for every one, written in the same transaction as the
        write itself, so a resend can never apply twice.
      </>
    ),
    href: '/docs/client/offline-sync',
    cta: 'How the outbox works',
    evidence: (
      <>
        <div className="plr-code">
          <div className="plr-file">client.ts</div>
          <pre>
            <code>
              <span className="k">import</span> {'{'}
              {'\n  '}ConcileClient,
              {'\n  '}indexedDBOutbox,
              {'\n'}
              {'}'} <span className="k">from</span>{' '}
              <span className="s">&quot;@concile/client&quot;</span>;
              {'\n\n'}
              <span className="k">const</span> client = <span className="k">new</span>{' '}
              <span className="f">ConcileClient</span>(
              {'\n  '}transport,
              {'\n  '}{'{'} outbox: <span className="f">indexedDBOutbox</span>() {'}'},
              {'\n'});
            </code>
          </pre>
        </div>
        <Chips
          items={[
            { label: 'Survives a reload', note: 'and a crash' },
            { label: 'Exactly once', note: 'receipts, not guesses' },
            { label: 'One queue', note: 'shared across every tab' },
          ]}
        />
      </>
    ),
  },
  {
    n: '02',
    k: 'bring your own database',
    title: 'SQLite and Postgres today. Anything tomorrow.',
    // source: docs/contributing/extending/storage-adapter
    body: (
      <>
        The engine never imports a database driver. It talks to one TypeScript interface called
        <code> DocStore</code>, and whatever sits behind that doorway is invisible to everything
        above it. Four backends ship today. Adding a fifth means implementing one interface, and
        nothing in the transactor, the query engine or the reactivity layer changes.
      </>
    ),
    href: '/docs/contributing/extending/storage-adapter',
    cta: 'Write a storage adapter',
    evidence: (
      <Chips
        items={[
          { label: 'SQLite', note: 'embedded, zero setup' },
          { label: 'Postgres', note: 'one flag, no code change' },
          { label: 'Durable Object SQLite', note: 'Cloudflare' },
          { label: 'Cloudflare D1', note: 'relational' },
          { label: 'Yours', note: 'one interface to implement' },
        ]}
      />
    ),
  },
  {
    n: '03',
    k: 'no migrations',
    title: 'Add a field. Deploy. That is the whole migration.',
    // source: docs/core-concepts/schema-and-tables, docs/deploy/postgres
    body: (
      <>
        Your tables, fields and indexes live as data inside a small fixed set of internal tables
        that never change shape as your schema evolves. There is no <code>CREATE TABLE</code> and
        no <code>ALTER TABLE</code>, on SQLite or on Postgres. Additive changes go live with nothing
        to run first and no migration file to write.
      </>
    ),
    href: '/docs/core-concepts/schema-and-tables',
    cta: 'Schema and tables',
    evidence: (
      <div className="plr-code">
        <div className="plr-file">concile/schema.ts</div>
        <pre>
          <code>
            messages: <span className="f">defineTable</span>({'{'}
            {'\n  '}body: v.<span className="f">string</span>(),
            {'\n  '}
            <span className="add">author: v.string(),</span>{' '}
            <span className="c">{'// new'}</span>
            {'\n'}
            {'}'}),
          </code>
        </pre>
        <p className="plr-caption">
          Deploy it. There is no second step, on either database.
        </p>
      </div>
    ),
  },
  {
    n: '04',
    k: 'deploy anywhere',
    title: 'Six targets, one command',
    // source: docs/deploy/deploy-and-build "The six deploy targets"
    body: (
      <>
        <code>concile deploy --target</code> decides where it lands. Your own server, Docker,
        Cloudflare, Railway, Fly, or AWS App Runner. No provider SDK is ever bundled into Concile.
        Each target shells out to the CLI you already have installed, and tells you exactly what is
        missing if you do not.
      </>
    ),
    href: '/docs/deploy/deploy-and-build',
    cta: 'Deploy and build',
    evidence: (
      <Chips
        items={[
          { label: 'serve', note: 'live hot-swap' },
          { label: 'docker', note: 'compose up' },
          { label: 'cloudflare', note: 'Durable Objects' },
          { label: 'railway', note: 'railway up' },
          { label: 'fly', note: 'fly deploy' },
          { label: 'aws', note: 'App Runner' },
        ]}
      />
    ),
  },
  {
    n: '05',
    k: 'one binary that scales',
    title: 'Every node runs the same command',
    // source: docs/deploy/scaling "Tier 2: the fleet"
    body: (
      <>
        There is no primary flag, no replica flag, and no coordinator process to run. Start the same
        binary as many times as you like and the fleet sorts out its own roles. The first node to
        take the lease becomes the writer, every other node serves reads from its own local copy,
        and a client can connect to any of them without knowing the difference. Kill the writer and
        another one takes over in about two seconds.
      </>
    ),
    href: '/docs/deploy/scaling',
    cta: 'Scaling and the fleet',
    evidence: (
      <>
        <div className="plr-code">
          <div className="plr-file">every node, identical</div>
          <pre>
            <code>
              concile serve --fleet \{'\n  '}--database-url <span className="s">$PG</span> \{'\n  '}
              --advertise-url <span className="s">$SELF</span>
            </code>
          </pre>
        </div>
        <Chips
          items={[
            { label: 'node-1', note: 'writer, self-elected' },
            { label: 'node-2', note: 'reads, local replica' },
            { label: 'node-3', note: 'reads, local replica' },
          ]}
        />
      </>
    ),
  },
];

export function Pillars() {
  return (
    <div className="plr">
      {PILLARS.map((p) => (
        <article className="plr-row" key={p.n}>
          <div className="plr-copy">
            <div className="plr-head">
              <span className="plr-n" aria-hidden="true">
                {p.n}
              </span>
              <span className="k">{p.k}</span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.body}</p>
            <Link className="tlink" href={p.href}>
              {p.cta}
            </Link>
          </div>
          <div className="plr-ev">{p.evidence}</div>
        </article>
      ))}
    </div>
  );
}
