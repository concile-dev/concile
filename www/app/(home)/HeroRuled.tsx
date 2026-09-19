'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HeroHalftone } from './HeroHalftone';
import { HeroVeil } from './DarkVeil';
import { HeroSilk } from './Silk';
import { HeroBeams } from './Beams';
import { EditorShowcase } from '@/components/editor-showcase';
import './hero-ruled.css';

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const INSTALL = 'npm i concile';

// The rolling feed that makes the "live" card actually move. Each tick pushes
// the next item, so a first-time visitor sees data arriving on its own.
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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  // Backdrop switch. DarkVeil is the design on this branch; ?bg=field and
  // ?bg=halftone keep the previous two reachable side by side. Read after mount
  // rather than from useSearchParams, so the server and the first client render
  // agree and there is no hydration mismatch to reconcile. All of this goes
  // once one of the three wins.
  const [bg, setBg] = useState<'beams' | 'silk' | 'veil' | 'field' | 'halftone'>('beams');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('bg');
    if (q === 'field' || q === 'halftone' || q === 'veil' || q === 'silk') setBg(q);
  }, []);

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
      {bg === 'beams' && <HeroBeams />}
      {bg === 'silk' && <HeroSilk />}
      {bg === 'veil' && <HeroVeil />}
      {bg === 'halftone' && <HeroHalftone />}
      {bg === 'field' && <div className="hr-field" aria-hidden="true" />}
      {(bg === 'field' || bg === 'halftone') && <div className="hr-wash" aria-hidden="true" />}

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

        {/* The editor is the product surface: a real project's files, the
            function you would actually write, and the client it updates. Let
            deliberately to run past the right edge, after the Payload hero. The
            crop is safe here in a way it was not for the status cards: the file
            tree, the tabs, the Run button and the code all sit in the left two
            columns, and only the preview pane is cut. */}
        <div className="hr-stage">
          <div className="hr-editor">
            <EditorShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
