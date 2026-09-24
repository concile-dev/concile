import Link from 'next/link';
import { appName, gitConfig } from '@/lib/shared';

// Shared marketing footer, used by every non-docs route group.
const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/docs/get-started/what-is-concile', label: 'What is Concile' },
      { href: '/docs/get-started/quickstart', label: 'Quickstart' },
      { href: '/docs/core-concepts/reactivity', label: 'Reactivity' },
      { href: '/docs/deploy/self-hosting', label: 'Self-hosting' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { href: '/docs', label: 'Documentation' },
      { href: '/docs/reference/faq', label: 'FAQ' },
      { href: '/blog', label: 'Blog' },
      { href: '/compare', label: 'Compare' },
      { href: '/brand', label: 'Brand' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-brand-col">
          <p className="ft-brand">{appName}</p>
          <p className="ft-tag">The reactive backend you self-host.</p>
          <span className="ft-license">FSL-1.1-Apache-2.0</span>
        </div>

        {COLUMNS.map((col) => (
          <nav className="ft-col" key={col.title} aria-label={col.title}>
            <span className="ft-h">{col.title}</span>
            {col.links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        ))}

        <nav className="ft-col" aria-label="Community">
          <span className="ft-h">Community</span>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <Link href="/docs/contributing">Contributing</Link>
        </nav>
      </div>

      <div className="ft-bottom">
        <span>© Concile</span>
        <span>Your data. Your server. Forever.</span>
      </div>
    </footer>
  );
}
