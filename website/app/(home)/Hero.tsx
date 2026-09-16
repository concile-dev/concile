'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import './hero.css';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// The rolling feed that makes the "live" card actually move. Each tick pushes
// the next item, so a first-time visitor sees data arriving on its own.
const FEED = [
  'Ada joined #general',
  'shipped v0.9 to prod',
  'Grace: deploying now',
  'new order #1042',
  'Lin reacted 🎉',
  'payment captured',
  'Kojo opened a PR',
  'inbox: 3 new replies',
];

export function Hero() {
  const [feed, setFeed] = useState(() => FEED.slice(0, 3).map((t, i) => ({ id: i, t })));
  const [ping, setPing] = useState(0);

  useEffect(() => {
    let next = 3;
    const timer = setInterval(() => {
      setFeed((cur) => {
        const item = { id: next, t: FEED[next % FEED.length] };
        next += 1;
        return [...cur.slice(-3), item];
      });
      setPing((p) => p + 1);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hx">
      {/* Quiet backdrop: one soft mesh + one static grid. The only thing that
          moves in this hero is the data. The copy paints instantly (no fade-in). */}
      <div className="hx-bg" aria-hidden="true">
        <div className="hx-aurora" />
        <div className="hx-grid" />
      </div>

      <div className="hx-inner">
        <div className="hx-copy">
          <p className="hx-kicker">
            <span className="hx-dot" /> open source · self-hosted · reactive
          </p>

          <h1 className="hx-title">
            Write a function. Watch your whole app <span className="hx-em">come alive.</span>
          </h1>

          <p className="hx-lede">
            Concile is the backend where your data updates itself. Write TypeScript functions,
            subscribe once, and every screen stays live. No polling. No refresh. No glue.
          </p>

          <div className="hx-cta">
            <Link className="hx-btn hx-btn--primary" href="/docs/get-started/quickstart">
              Read the quickstart
              <span className="hx-arrow">→</span>
            </Link>
            <Link className="hx-btn hx-btn--ghost" href="/docs/get-started/what-is-concile">
              How it works
            </Link>
          </div>

          <p className="hx-install">
            <code>npm i concile</code>
          </p>
        </div>

        {/* Live panel: a write in the code card propagates down the wire and lands
            as a highlighted row in the client. Paints instantly; only the feed moves. */}
        <div className="hx-panel">
          <div className="hx-card hx-card--code">
            <div className="hx-card-bar">
              <span className="hx-file">concile/messages.ts</span>
              <span className="hx-tag">server</span>
            </div>
            <pre className="hx-code">
              <code>
                <span className="c">{'// one write, live everywhere'}</span>{'\n'}
                <span className="k">export const</span> <span className="f">add</span> ={' '}
                <span className="f">mutation</span>(<span className="p">async</span> (ctx, {'{'} text {'}'}) {'=>'}
                {'\n  '}ctx.<span className="f">db</span>.<span className="f">insert</span>(
                <span className="s">&quot;messages&quot;</span>, {'{'} text {'}'})
                {'\n'});
              </code>
            </pre>
          </div>

          {/* the wire */}
          <div className="hx-conn" aria-hidden="true">
            <span className="hx-wire" />
            <motion.span
              key={ping}
              className="hx-comet"
              initial={{ top: '0%', opacity: 0 }}
              animate={{ top: '100%', opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.45, ease: EASE }}
            />
            <span className="hx-conn-cap">≈ 8.6 ms</span>
          </div>

          <div className="hx-card hx-card--live">
            <div className="hx-card-bar">
              <span className="hx-file">your app</span>
              <span className="hx-live">
                <span className="hx-live-dot" key={ping} />
                live
              </span>
            </div>
            <ul className="hx-feed">
              {feed.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ y: -10, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 18%, transparent)' }}
                  animate={{ y: 0, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 0%, transparent)' }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className={i === feed.length - 1 ? 'is-new' : ''}
                >
                  <span className="hx-avatar" />
                  {m.t}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
