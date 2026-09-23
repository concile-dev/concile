'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { NAV } from './nav';

// The narrow-viewport menu. Below 720px home.css hides the nav links, the star
// pill and the CTA, and shows this control instead. It used to be a link to
// /docs, which threw away every other destination. Now it opens a panel with
// the same links the wide header has.
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  // Close on Escape, and never leave the panel open behind a navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="hp-icon hp-burger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="hp-mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {open ? (
            <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          ) : (
            <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <nav id="hp-mobile-menu" className="hp-mobile" aria-label="Main">
          {NAV.map((n) => (
            <Link className="hp-mobile-link" key={n.label} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link className="hp-mobile-link" href="/docs/get-started/quickstart" onClick={() => setOpen(false)}>
            Get Started
          </Link>
          <a
            className="hp-mobile-link"
            href="https://github.com/concile-dev/concile"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            GitHub
          </a>
        </nav>
      )}
    </>
  );
}
