import Link from 'next/link';
import './landing.css';
import { STACK_LOGOS } from './stack-logos';
import { Hero } from './Hero';
import { Reveal } from './Reveal';
import { SpotlightGrid } from './SpotlightGrid';
import { StatNumber } from './StatNumber';
import { BeamDiagram } from './BeamDiagram';
import { Steps } from './Steps';
import { FeatureCards } from './FeatureCards';
import { Components } from './Components';
import { Pillars } from './Pillars';
import { ComparisonTable } from './ComparisonTable';
import { Faq } from './Faq';
import { CopyCommand } from './CopyCommand';
import { DashboardShowcase } from './DashboardShowcase';
import { BrowserFrame } from './BrowserFrame';
import { MacbookScroll } from './MacbookScroll';

export default function HomePage() {
  return (
    <div className="lp">
      {/* ---------------- HERO (animated, full-bleed) ---------------- */}
      <Hero />

      {/* ---------------- WORKS-WITH STRIP ---------------- */}
      <section className="strip">
        <div className="wrap">
          <span className="strip-label">Works with the stack you already use</span>
          <div className="strip-mask">
            <div className="strip-track">
              {STACK_LOGOS.concat(STACK_LOGOS).map((logo, i) => (
                <span
                  className="strip-pill"
                  key={`${logo.name}-${i}`}
                  /* the second copy exists only to make the marquee loop seamlessly */
                  aria-hidden={i >= STACK_LOGOS.length}
                >
                  {/* decorative: the visible label already names the tech, so the
                      mark is hidden from assistive tech to avoid a double read */}
                  <svg
                    className={`strip-logo${logo.needsLight ? ' is-dark-mark' : ''}`}
                    style={{ ['--logo' as string]: logo.hex }}
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d={logo.path} fill="currentColor" />
                  </svg>
                  {logo.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        {/* ---------------- HOW IT WORKS (numbered step rail) ---------------- */}
        <Reveal className="stp">
          <div className="stp-copy">
            <span className="k">Just TypeScript</span>
            <h2>From an empty folder to a live app in five steps</h2>
            <p>
              You write one language for the entire backend. Define your tables, create mutations and queries, and subscribe right from the client. When you're ready to deploy, it ships as a single container or binary. You don't have to design an API, and there are no migrations to run.
            </p>
            <Link className="tlink" href="/docs/get-started/quickstart">
              See the full quickstart
            </Link>
          </div>
          <Steps />
        </Reveal>

        {/* ---------------- DASHBOARD SHOWCASE (on the laptop screen) ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">The Dashboard</span>
            <h2>Watch your data change as it happens</h2>
            <p>
              We include a built-in dashboard that runs on the exact same origin as your app. It uses live subscriptions, meaning you see writes land in the database immediately. We didn't even build a refresh button, because you'll never need it.
            </p>
          </div>
          <MacbookScroll>
            <BrowserFrame url="localhost:3000/_dashboard">
              <DashboardShowcase />
            </BrowserFrame>
          </MacbookScroll>
        </Reveal>

        {/* ---------------- REACTIVITY DIAGRAM ---------------- */}
        <Reveal className="demo">
          <div className="demo-head">
            <span className="k">Live queries, not change feeds</span>
            <h3>Change feeds tell you a row changed. Concile tells you the answer changed.</h3>
            <p>
              Most backends just stream raw row events, forcing your client to figure out if that new row actually belongs in your filtered, sorted, paginated view. That means writing a query engine twice. Concile is different: it subscribes to the query itself, and only pushes a new result when a write actually affects your data.
            </p>
            {/* the bento's reactive-core tile used to carry this link; it was the
                page's only route to the reactivity doc, so it moved here. */}
            <Link className="tlink" href="/docs/core-concepts/reactivity">
              Read about reactivity
            </Link>
          </div>
          <BeamDiagram />
        </Reveal>

        {/* ---------------- CAPABILITIES (live mini-visuals) ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">Everything in the box</span>
            <h2>One process. Your entire backend.</h2>
            <p>
              We've packed reactivity, auth, scheduling, file storage, and a live dashboard into a single running program. There's no complex stack to piece together or network configurations to manage. Take a look below. Every card is a live, working piece of the real system.
            </p>
          </div>
          <FeatureCards />
        </Reveal>

        {/* ---------------- COMPONENTS (opt-in catalogue) ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">Batteries included. You pick which ones to use.</span>
            <h2>Six core components. Nothing you didn't ask for.</h2>
            <p>
              Features like auth, authorization, scheduling, workflows, triggers, and notifications come as separate packages. They all plug into the core engine exactly the same way. Just list what you need in your config file, and the rest won't even load.
            </p>
          </div>
          <Components />
        </Reveal>

        {/* ---------------- PILLARS ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">Why this one</span>
            <h2>Five things you can't just bolt on later</h2>
            <p>
              This isn't just another feature list. These are fundamental properties of how Concile is built. They're exactly why your app behaves differently when a user's network drops, when your database schemas change, or when you suddenly outgrow a single node.
            </p>
          </div>
          <Pillars />
        </Reveal>

        {/* ---------------- COMPARISON MATRIX ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head cmt-head">
            <span className="k">The honest version</span>
            <h2>We borrowed the best ideas</h2>
            <p>
              We loved Convex's reactive queries, Supabase's self-hosting, Firebase's resilient offline mode, and PocketBase's zero-setup single binary. So we brought those ideas together. Here's a transparent look at how we compare, including the areas where we fall short.
            </p>
          </div>
          <ComparisonTable />
        </Reveal>

        {/* ---------------- ESCAPE HATCHES + LIMITS ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">No magic</span>
            <h2>Where our model ends</h2>
            <p>
              Reactive functions aren't the right tool for everything, and honestly, some features just aren't built yet. We put them all right here so you find out now, rather than halfway through your next sprint.
            </p>
          </div>
        <SpotlightGrid className="bento">
          <article className="cell cell--rows s3">
            <span className="k">Escape hatches</span>
            <h3>When the model does not fit</h3>
            <ul>
              <li>
                <b>Actions</b>
                <span>Run outside the transaction for fetch, timers, and randomness.</span>
              </li>
              <li>
                <b>HTTP endpoints</b>
                <span>Public routes for webhooks. A Request goes in, a Response comes out.</span>
              </li>
              <li>
                <b>Crons and schedules</b>
                <span>runAfter, runAt, and cron expressions, durable across restarts.</span>
              </li>
            </ul>
          </article>

          {/* honest limits tile */}
          <article className="cell cell--limits s3">
            <span className="k">Honest limits</span>
            <h3>What it doesn't do yet</h3>
            <ul>
              <li>
                <b>No search</b>
                <span>Query by index and range. Full-text and vector are reserved seams.</span>
              </li>
              <li>
                <b>One writer by default</b>
                <span>
                  Multi-node write scale-out ships under a separate commercial license. It is the
                  newest part of the system. Start on one node.
                </span>
              </li>
              <li>
                <b>No built-in TLS</b>
                <span>Plain HTTP. Front it with nginx, Caddy, or Traefik.</span>
              </li>
              <li>
                <b>In-process functions</b>
                <span>A V8-isolate sandbox for untrusted code is a reserved seam.</span>
              </li>
            </ul>
          </article>

        </SpotlightGrid>
        </Reveal>

        {/* ---------------- STATS BAND ---------------- */}
        <Reveal className="stats">
          <div className="stat-item">
            <span className="stat-n">
              <StatNumber value={2000} />
            </span>
            <span className="stat-l">live subscribers on one core</span>
          </div>
          <div className="stat-item">
            <span className="stat-n">
              <StatNumber value={102} suffix=" ms" />
            </span>
            <span className="stat-l">median hot-push latency</span>
          </div>
          <div className="stat-item">
            <span className="stat-n">
              <StatNumber value={8.6} decimals={1} suffix=" ms" />
            </span>
            <span className="stat-l">reactive propagation, p50</span>
          </div>
          <div className="stat-item">
            <span className="stat-n">
              <StatNumber value={12} suffix=" %" />
            </span>
            <span className="stat-l">CPU at that load</span>
          </div>
          {/* the deleted 8.6ms bento tile owned this link, and it repeated the
              p50 that this band already states */}
          <Link className="tlink stats-link" href="/docs/get-started/performance">
            Run the benchmark yourself
          </Link>
        </Reveal>

        {/* ---------------- FAQ ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">before you ask</span>
            <h2>Questions people actually ask</h2>
            <p>
              The short answers. Every one of them links to the longer version in the docs, where
              the caveats live.
            </p>
          </div>
          <Faq />
        </Reveal>
      </div>

      {/* ---------------- FINAL CTA (glow) ---------------- */}
      <section className="cta2">
        <div className="cta2-glow" aria-hidden="true" />
        <Reveal className="cta2-inner">
          <span className="kicker">Get started</span>
          <h2>Write one query. Watch it stay live.</h2>
          <p>
            The quickstart takes you from an empty folder to a live app in a few minutes. It runs on
            your machine today, and on your own server tomorrow.
          </p>
          <div className="cta2-row">
            <Link className="hx-btn hx-btn--primary" href="/docs/get-started/quickstart">
              Start building
              <span className="hx-arrow">→</span>
            </Link>
            <a
              className="hx-btn hx-btn--ghost"
              href="https://github.com/concile-dev/concile"
              target="_blank"
              rel="noreferrer"
            >
              Star on GitHub
            </a>
          </div>
          <div className="cta2-cmd">
            <CopyCommand command="npm i concile && npx concile dev" />
          </div>
        </Reveal>
      </section>

      {/* ---------------- FOOTER — Ft2 Inline ---------------- */}
    </div>
  );
}
