import Link from 'next/link';

// The component catalogue. Deliberately not a third card grid: the page already
// runs FeatureCards straight into the bento, and a third one would read as more
// of the same field. Rows on hairlines instead, against the real config file.
//
// Names, one-liners and hrefs all track docs/components/*.mdx. If a
// component's docs description changes, change it here too.
type Component = { pkg: string; name: string; blurb: string; href: string };

const COMPONENTS: Component[] = [
  {
    pkg: '@concile/auth',
    name: 'Auth',
    blurb: 'Sessions, email, OAuth, MFA, and passkeys.',
    href: '/docs/components/auth',
  },
  {
    pkg: '@concile/authz',
    name: 'Authorization',
    blurb: 'RBAC, ReBAC, and row policies.',
    href: '/docs/components/authorization',
  },
  {
    pkg: '@concile/scheduler',
    name: 'Scheduling',
    blurb: 'runAfter, runAt, and cron jobs.',
    href: '/docs/components/scheduling',
  },
  {
    pkg: '@concile/workflow',
    name: 'Workflows',
    blurb: 'Durable multi-step orchestration.',
    href: '/docs/components/workflows',
  },
  {
    pkg: '@concile/triggers',
    name: 'Triggers',
    blurb: 'React to table changes.',
    href: '/docs/components/triggers',
  },
  {
    pkg: '@concile/notifications',
    name: 'Notifications',
    blurb: 'Email, SMS, in-app, and push.',
    href: '/docs/components/notifications',
  },
];

export function Components() {
  return (
    <div className="cmp">
      <div className="cmp-aside">
        <div className="cmp-code">
          <div className="cmp-file">concile.config.ts</div>
          <pre>
            <code>
              <span className="k">import</span> {'{'} defineConfig {'}'} <span className="k">from</span>{' '}
              <span className="s">&quot;@concile/component&quot;</span>;
              {'\n'}
              <span className="k">import</span> {'{'} defineAuth {'}'} <span className="k">from</span>{' '}
              <span className="s">&quot;@concile/auth&quot;</span>;
              {'\n'}
              <span className="k">import</span> {'{'} defineScheduler {'}'} <span className="k">from</span>{' '}
              <span className="s">&quot;@concile/scheduler&quot;</span>;
              {'\n\n'}
              <span className="k">export default</span> <span className="f">defineConfig</span>({'{'}
              {'\n  '}components: [
              {'\n    '}
              <span className="f">defineAuth</span>({'{'} <span className="c">/* … */</span> {'}'}),
              {'\n    '}
              <span className="f">defineScheduler</span>(),
              {'\n  '}],
              {'\n'}
              {'}'});
            </code>
          </pre>
        </div>
        <p className="cmp-note">
          Nothing is installed for you, and nothing runs that you did not list. The core engine does
          not know what auth or workflows are, and it does not need to.
        </p>
      </div>

      <ul className="cmp-list">
        {COMPONENTS.map((c) => (
          <li className="cmp-item" key={c.pkg}>
            <Link className="cmp-row" href={c.href}>
              <span className="cmp-pkg">{c.pkg}</span>
              <span className="cmp-name">{c.name}</span>
              <span className="cmp-blurb">{c.blurb}</span>
              <span className="cmp-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
