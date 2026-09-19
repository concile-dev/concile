import Link from 'next/link';
import './landing.css';
import { STACK_LOGOS } from './stack-logos';
import { HeroRuled } from './HeroRuled';
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
      <HeroRuled />

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
            <span className="k">just typescript</span>
            <h3>Define it, subscribe to it, ship it</h3>
            <p>
              One language for the whole backend. Write a mutation, read it with a query, and the
              same code stays live in every client. When you are ready, ship it as a single binary
              or a container.
            </p>
            <Link className="tlink" href="/docs/get-started/quickstart">
              Read the quickstart
            </Link>
          </div>
          <Steps />
        </Reveal>

        {/* ---------------- DASHBOARD SHOWCASE (on the laptop screen) ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">the dashboard</span>
            <h2>Watch your data change as you write it</h2>
            <p>
              Concile ships a dashboard with every project. It reads through a live subscription, so
              writes land in the table as they happen. There is no refresh button, because there is
              nothing to refresh.
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
            <span className="k">see it live</span>
            <h3>One write. Every client. At once.</h3>
            <p>
              Your functions talk to one engine. Every subscriber reads the same query, so a single
              commit reaches all of them. No refresh, no polling, no glue.
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
            <span className="k">everything in the box</span>
            <h2>A whole backend, and you can watch each piece work</h2>
            <p>
              Reactivity, auth, scheduling, file storage, and a live dashboard. Opt in to what you
              need. Every card below is a small live view of the real thing.
            </p>
          </div>
          <FeatureCards />
        </Reveal>

        {/* ---------------- COMPONENTS (opt-in catalogue) ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">batteries included, you pick the ones</span>
            <h2>Six components. Nothing you did not ask for.</h2>
            <p>
              Auth, authorization, scheduling, workflows, triggers and notifications ship as
              separate packages. Each one plugs into the engine through a single seam, and you
              compose the ones you want in one config file.
            </p>
          </div>
          <Components />
        </Reveal>

        {/* ---------------- PILLARS ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">why this one</span>
            <h2>Five things you cannot bolt on later</h2>
            <p>
              Not a feature list. These are properties of how Concile is built, and they are the
              reason it behaves differently when the network drops, when your database changes, or
              when one node stops being enough.
            </p>
          </div>
          <Pillars />
        </Reveal>

        {/* ---------------- COMPARISON MATRIX ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head cmt-head">
            <span className="k">the honest version</span>
            <h2>We took the good parts</h2>
            <p>
              Reactive queries from Convex. A real database you can self-host from Supabase. Offline
              that just works from Firebase. One binary and no setup from PocketBase. Here is where
              that leaves us, including the two rows where it does not go our way.
            </p>
          </div>
          <ComparisonTable />
        </Reveal>

        {/* ---------------- ESCAPE HATCHES + LIMITS ---------------- */}
        <Reveal className="fc-section">
          <div className="fc-head">
            <span className="k">no magic</span>
            <h2>Where the model ends</h2>
            <p>
              Reactive functions do not fit every job, and some things are simply not built yet.
              Here is both, in one place, so you find out now instead of halfway through a sprint.
            </p>
          </div>
        <SpotlightGrid className="bento">
          <article className="cell cell--rows s3">
            <span className="k">escape hatches</span>
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
            <span className="k">honest limits</span>
            <h3>What it doesn&apos;t do yet</h3>
            <ul>
              <li>
                <b>No search</b>
                <span>Query by index and range. Full-text and vector are reserved seams.</span>
              </li>
              <li>
                <b>One writer by default</b>
                <span>
                  Multi-node write scale-out ships, but it is the newest part. Start on one node.
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
          <h2>Write your first reactive function in a few minutes.</h2>
          <p>The quickstart takes you from an empty folder to a live, reactive app.</p>
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
            <CopyCommand command="npx concile dev" />
          </div>
        </Reveal>
      </section>

      {/* ---------------- FOOTER — Ft2 Inline ---------------- */}
    </div>
  );
}
