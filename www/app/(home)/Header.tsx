import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

// Compact bar. Small type, generous horizontal spacing, one hairline underneath,
// and no coloured CTA. The "Get Started" control is a bordered box, not a pill.
const NAV = [
  { label: 'Product', href: '/docs/get-started/what-is-concile' },
  { label: 'Why Concile', href: '/docs/reference/faq' },
  { label: 'Developers', href: '/docs' },
  { label: 'Self-host', href: '/docs/deploy/self-hosting' },
  { label: 'Docs', href: '/docs' },
];

export function Header() {
  return (
    <header className="hp-head">
      <Link className="hp-mark" href="/">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="13" height="13" stroke="currentColor" strokeWidth="1.4" />
          <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        concile
      </Link>

      <nav className="hp-nav">
        {NAV.map((n) => (
          <Link className="hp-link" key={n.label} href={n.href}>
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="hp-head-right">
        <a
          className="hp-stars hp-link"
          href="https://github.com/concile-dev/concile"
          target="_blank"
          rel="noreferrer"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.14.46.55.38A8 8 0 0 0 8 0Z" />
          </svg>
          2
        </a>
        <Link className="hp-link" href="/docs">
          Login
        </Link>
        <Link className="hp-btn" href="/docs/get-started/quickstart">
          Get Started
        </Link>
        <ThemeToggle />
        <Link className="hp-icon" href="/docs" aria-label="Search the docs">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Link>
        <Link className="hp-icon hp-burger" href="/docs" aria-label="Menu">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
