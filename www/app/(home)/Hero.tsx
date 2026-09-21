'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EditorShowcase } from '@/components/editor-showcase';
import { LogPanel } from './ProductUI';

// v2's hero, verbatim: 45/55, copy on the left, product on the right, both in
// document flow. The editor is the primary image and runs 6% past the page
// edge; the log card is the one supporting image and overlaps its lower corner.
// Neither can reach the copy, and the hero's bottom padding keeps both inside
// this section.
//
// The one difference from v2 is the container. This hero sits in v1's 76rem
// column rather than v2's 1440px page, so the headline starts on the same left
// edge as every section below it and the composition still answers to the grid.

export function Hero() {
  const [copied, setCopied] = useState(false);
  return (
    <section className="hp-hero">
      <div className="hp-hero-inner">
        <div className="hp-hero-copy hp-rise">
          <h1>The backend to build the modern web.</h1>
          <p className="hp-body">
            The open-source reactive backend you run yourself. Write a function, subscribe once,
            and every screen stays live.
          </p>
          <div className="hp-cmd">
            {/* The prompt is marked up so it can carry the signal on its own. It
                is decoration, not content: a screen reader should hear the
                command, not the dollar sign. */}
            <span>
              <i className="hp-prompt" aria-hidden="true">$</i> npx create-concile-app
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText('npx create-concile-app');
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              }}
              aria-label={copied ? 'Copied' : 'Copy the install command'}
            >
              {copied ? (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8.5 6.5 12 13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="5.5" y="5.5" width="9" height="9" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M10.5 5.5v-3h-9v9h3" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              )}
            </button>
          </div>
          <div className="hp-hero-links">
            <Link className="hp-arrow" href="/docs/get-started/quickstart">
              <span>Read the quickstart</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="hp-hero-art hp-rise hp-rise--2" aria-hidden="true">
          <figure
            className="hp-shot hp-shot--editor hp-shot--bleed"
            role="img"
            aria-label="The Concile editor running a mutation"
          >
            <EditorShowcase />
          </figure>
          <figure
            className="hp-shot hp-shot--log"
            role="img"
            aria-label="Function logs in the Concile dashboard"
          >
            <LogPanel />
          </figure>
        </div>
      </div>
    </section>
  );
}
