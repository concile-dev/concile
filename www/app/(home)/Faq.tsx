'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';

// Single-open accordion, matching the docs FAQ's <Accordions type="single">.
// The open/close animation is a CSS grid-template-rows 0fr -> 1fr transition
// rather than a measured height, so there is no ResizeObserver and no layout
// read. Answers track docs/reference/faq.mdx. If an answer changes
// there, change it here too.
type Item = { q: string; a: ReactNode };

const ITEMS: Item[] = [
  {
    q: 'Is Concile production ready?',
    a: (
      <>
        <p>
          For a single node, yes. The engine, client, dashboard and CLI are real, and the whole
          component set is exercised end to end through the shipped CLI, not just unit tests.
        </p>
        <p>
          Multi-node write scale-out is the newest part, and it lives under a separate license in{' '}
          <code>ee/</code>. Start on one node with SQLite or Postgres. Reach for the fleet once you
          have measured a real ceiling.
        </p>
        <p>
          The part nobody likes saying out loud: Firebase has a decade of production history at
          Google&rsquo;s scale, and we have none. Weigh that honestly.
        </p>
        <Link className="tlink" href="/docs/reference/faq">
          Read the full answer
        </Link>
      </>
    ),
  },
  {
    q: 'Why not just use Postgres and a change feed?',
    a: (
      <>
        <p>
          Because they solve different problems, and the gap shows the moment a query is more than
          &ldquo;give me every row&rdquo;. A change feed streams raw row events. Your client has to
          decide, for every event, whether that row still belongs in the filtered, sorted,
          paginated list on screen. That is a query engine, running on the client, that you now
          maintain.
        </p>
        <p>
          A live query is subscribed to the result instead. The server works out whether a write
          could have changed that result, and pushes the new one when it did.
        </p>
        <p>
          The honest caveat: a change feed is plenty for an app that only needs to know when a
          table changed. It stops being enough the moment the view is anything more than flat.
        </p>
        <Link className="tlink" href="/docs/core-concepts/reactivity">
          How reactivity works
        </Link>
      </>
    ),
  },
  {
    q: 'How is this different from Convex?',
    a: (
      <>
        <p>
          The reactive model is deliberately modelled on Convex&rsquo;s published architecture. A
          query records its read set, a mutation commits a write set, and a subscription re-runs
          when the two intersect. Same idea, built clean-room from public docs. Same license family
          too, so this is not an open-versus-closed story.
        </p>
        <p>
          The difference is posture. Convex&rsquo;s own docs point you at their cloud for a more
          hands-off setup. There is no Concile cloud to point you at. Self-hosting is the product,
          storage is pluggable, and the whole thing compiles to a single binary.
        </p>
        <Link className="tlink" href="/docs/reference/migrate-from-convex">
          Migrating from Convex
        </Link>
      </>
    ),
  },
  {
    q: 'Is it actually free to self-host?',
    a: (
      <>
        <p>
          Yes, and not as a trial. Concile is licensed FSL-1.1-Apache-2.0, the same license Convex
          uses. You can use it, change it and self-host it commercially. Each release turns into
          plain Apache 2.0 two years after it ships. There is no phone-home and no metered usage.
        </p>
        <p>
          The license forbids one thing: reselling Concile itself as a competing hosted service.
        </p>
        <p>
          One detail we will not bury. Single-node self-hosting is free forever. Multi-node write
          scale-out lives in <code>ee/</code> under a separate commercial license, and it is free to
          use today with no license key.
        </p>
        <Link className="tlink" href="/docs/contributing/licensing">
          Read the license terms
        </Link>
      </>
    ),
  },
  {
    q: 'Do I need to run Postgres?',
    a: (
      <>
        <p>
          No. SQLite is the default and there is nothing to install. It is also the faster of the
          two on one node, because there is no network hop and no fsync on every commit.
        </p>
        <p>
          Point it at Postgres with one flag when you want the backups and replicas you already
          run. Your application code does not change, and neither store ever needs a migration
          file.
        </p>
        <Link className="tlink" href="/docs/deploy/postgres">
          SQLite and Postgres compared
        </Link>
      </>
    ),
  },
  {
    q: 'Does it do full-text or vector search?',
    a: (
      <>
        <p>
          Not yet, and we do not pretend otherwise anywhere in the docs. There is no search index
          builder, and the Convex migration tool reports search usage as unsupported rather than
          translating it badly.
        </p>
        <p>If your app needs search today, put an external service next to it.</p>
        <Link className="tlink" href="/docs/reference/faq">
          The rest of what is not built
        </Link>
      </>
    ),
  },
  {
    q: 'Can I get my data back out?',
    a: (
      <>
        <p>
          Yes, with one command. <code>concile migrate export</code> pulls a full point-in-time dump
          from a running deployment, and <code>import</code> pushes it into a fresh one. The same
          tool works between any two hosts.
        </p>
        <p>
          Your functions move too. The same code runs on dev, Docker, a binary, a fleet or
          Cloudflare without edits.
        </p>
        <Link className="tlink" href="/docs/reference/faq">
          How portability works
        </Link>
      </>
    ),
  },
];

export function Faq() {
  // null means every panel is closed. Opening one closes the other.
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className="faq">
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.q}>
            <h3 className="faq-q">
              <button
                type="button"
                className="faq-btn"
                aria-expanded={isOpen}
                aria-controls={`${base}-panel-${i}`}
                id={`${base}-btn-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-sign" aria-hidden="true">
                  <svg viewBox="0 0 16 16" focusable="false">
                    <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path
                      className="faq-sign-v"
                      d="M8 3v10"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
            </h3>
            <div
              className="faq-panel"
              id={`${base}-panel-${i}`}
              role="region"
              aria-labelledby={`${base}-btn-${i}`}
              // inert (React 19 supports it as a boolean) keeps a closed answer
              // out of the tab order and out of find-in-page, not merely at zero
              // height where its links stay focusable
              inert={!isOpen}
            >
              <div className="faq-panel-inner">{item.a}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
