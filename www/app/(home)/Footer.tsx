import Link from 'next/link';

// Four columns on the same rules as the rest of the page, then the wordmark,
// oversized and cropped by the page edge rather than centred inside it.
const COLS: { head: string; links: { label: string; href: string }[] }[] = [
  {
    head: 'Use cases',
    links: [
      { label: 'Realtime collaboration', href: '/docs/core-concepts/reactivity' },
      { label: 'Offline-first apps', href: '/docs/client/offline-sync' },
      { label: 'Self-hosted SaaS', href: '/docs/deploy/self-hosting' },
      { label: 'Local-first tools', href: '/docs/deploy/deploy-and-build' },
    ],
  },
  {
    head: 'Developers',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Quickstart', href: '/docs/get-started/quickstart' },
      { label: 'Tutorial', href: '/docs/get-started/tutorial' },
      { label: 'Testing', href: '/docs/reference/testing' },
      { label: 'Contributing', href: '/docs/contributing' },
    ],
  },
  {
    head: 'Company',
    links: [
      { label: 'What is Concile', href: '/docs/get-started/what-is-concile' },
      { label: 'Performance', href: '/docs/get-started/performance' },
      { label: 'Migrate from Convex', href: '/docs/reference/migrate-from-convex' },
      { label: 'Licensing', href: '/docs/contributing/licensing' },
      { label: 'FAQ', href: '/docs/reference/faq' },
      { label: 'Blog', href: '/blog' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="hp-foot">
      <div className="hp-wrap hp-foot-grid">
        {COLS.map((c) => (
          <div className="hp-foot-col" key={c.head}>
            <h3>{c.head}</h3>
            <ul>
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link className="hp-link" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="hp-foot-col">
          <h3>Stay connected</h3>
          {/* Presentational on this design route: there is nowhere to post to,
              and a submit handler would push the whole footer client-side. */}
          <div className="hp-sub">
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <button type="button" aria-label="Subscribe">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="hp-social">
            <a href="https://github.com/concile-dev/concile" target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.14.46.55.38A8 8 0 0 0 8 0Z" />
              </svg>
            </a>
            <Link className="hp-link" href="/docs" aria-label="Documentation">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 2.5h6l4 4v7h-10z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M9 2.5v4h4" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="hp-wordmark" aria-hidden="true">
        <span>concile</span>
      </div>
    </footer>
  );
}
