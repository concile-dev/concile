'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appName } from '@/lib/shared';
import { ThemeToggle } from '@/components/theme-toggle';
import { GitHubStars } from '@/components/github-stars';

// Shared marketing chrome. Used by every non-docs route group, so the
// (home) and (content) groups look identical without fighting fumadocs'
// HomeLayout. Docs keeps fumadocs' DocsLayout.
const LINKS = [
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="nb">
      <div className="nb-inner">
        <Link href="/" className="nb-brand">
          {appName}
        </Link>

        <nav className="nb-links" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nb-link${pathname?.startsWith(l.href) ? ' is-active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nb-right">
          <GitHubStars />
          <ThemeToggle />
          <Link className="nb-cta" href="/docs/get-started/quickstart">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
