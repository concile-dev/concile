import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';
import { GitHubStars } from '@/components/github-stars';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';
import { NAV } from './nav';

// Compact bar. Small type, generous horizontal spacing, one hairline underneath,
// and no coloured CTA. The "Get Started" control is a bordered box, not a pill.
//
// Every control here goes somewhere real. There is no login, because there is
// no Concile cloud to log in to, and the star count is fetched, not typed in.

export function Header() {
  return (
    <header className="hp-head">
      <Link className="hp-mark" href="/">
        <BrandMark size={19} />
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
        <GitHubStars className="hp-stars hp-link" />
        <Link className="hp-btn" href="/docs/get-started/quickstart">
          Get Started
        </Link>
        <ThemeToggle />
        <MobileMenu />
      </div>
    </header>
  );
}
