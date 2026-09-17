'use client';

import type { ReactNode } from 'react';

// Safari's toolbar, reproduced so the dashboard reads as a real page rather than
// a floating panel. Rendered maximized: a browser on a laptop screen normally is,
// and it leaves the whole screen below the bar for the app.
//
// Chrome only, so the whole bar is aria-hidden. The page inside it is the content.

function Chevron({ dir }: { dir: 'l' | 'r' }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'l' ? 'M15 18L9 12l6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

export function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="bw">
      <div className="bw-bar" aria-hidden="true">
        <span className="bw-dots">
          <i className="is-red" />
          <i className="is-amber" />
          <i className="is-green" />
        </span>

        <span className="bw-nav">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
          </svg>
          <Chevron dir="l" />
          <Chevron dir="r" />
        </span>

        <span className="bw-url">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="bw-host">{url}</span>
          <svg className="bw-reload" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-2.6-6.4" />
            <path d="M21 3v6h-6" />
          </svg>
        </span>

        <span className="bw-tools">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V4M8 8l4-4 4 4" />
            <path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
          </svg>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="3" y="7" width="13" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          </svg>
        </span>
      </div>

      <div className="bw-view">{children}</div>
    </div>
  );
}
