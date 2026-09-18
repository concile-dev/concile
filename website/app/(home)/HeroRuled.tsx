'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import './hero-ruled.css';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INSTALL = 'npm i concile';

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

function CopyIcon() {
  return (
    <svg className="hr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="hr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

export function HeroRuled() {
  const [feed, setFeed] = useState(() => FEED.slice(0, 3).map((t, i) => ({ id: i, t })));
  const [ping, setPing] = useState(0);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
    } catch {
      // Clipboard is permission-gated and absent over plain http on some hosts.
      // The command is already on screen, so a failed copy costs the visitor
      // nothing and silence beats an error state they cannot act on.
    }
  };

  return (
    <section className="hr">
      <div className="hr-glow" aria-hidden="true" />

      <div className="hr-inner">
        <div className="hr-copy">
          <div className="hr-pad">
            <p className="hr-kicker">
              <span className="hr-dot" /> open source · self-hosted · reactive
            </p>

            <h1 className="hr-title">
              Write a function.
              <br />
              Watch your whole
              <br />
              app <em>come alive.</em>
            </h1>

            <p className="hr-lede">
              Concile is the backend where your data updates itself. Write TypeScript functions,
              subscribe once, and every screen stays live.
            </p>
          </div>

          <div className="hr-cells">
            <button type="button" className="hr-cell hr-cell--install" onClick={copy}>
              <span>
                <span className="hr-prompt">$ </span>
                {INSTALL}
              </span>
              {copied ? <span className="hr-copied">copied</span> : <CopyIcon />}
            </button>

            <Link className="hr-cell" href="/docs/get-started/quickstart">
              Read the quickstart
              <ArrowIcon />
            </Link>

            <Link className="hr-cell" href="/docs/get-started/what-is-concile">
              How it works
              <ArrowIcon />
            </Link>
          </div>
        </div>

        {/* The panels are the product, shown rather than described: a write in
            the code card lands as a row in the client below it. */}
        <div className="hr-stage">
          <div className="hr-deck">
            <div className="hr-card">
              <div className="hr-bar">
                <span>concile/messages.ts</span>
                <span className="hr-tag">server</span>
              </div>
              <pre className="hr-code">
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

            <div className="hr-card">
              <div className="hr-bar">
                <span>your app</span>
                <span className="hr-live">
                  <span className="hr-live-dot" key={ping} />
                  live
                </span>
              </div>
              <ul className="hr-feed">
                {feed.map((m) => (
                  <motion.li
                    key={m.id}
                    initial={{
                      y: -10,
                      backgroundColor: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                    }}
                    animate={{
                      y: 0,
                      backgroundColor: 'color-mix(in srgb, var(--primary) 0%, transparent)',
                    }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <span className="hr-avatar" />
                    {m.t}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
