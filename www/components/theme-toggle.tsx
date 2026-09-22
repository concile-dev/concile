'use client';

import { useEffect, useState } from 'react';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty, so setTheme()
// silently no-ops. fumadocs re-exports the matching hook for this reason.
import { useTheme } from 'fumadocs-ui/provider/base';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is unknown during SSR; hold the icon steady until mounted so the
  // markup matches and hydration doesn't warn.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      className="nb-icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
