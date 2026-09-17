import Link from 'next/link';
import './landing.css';
import { STACK_LOGOS } from './stack-logos';
import { Hero } from './Hero';
import { Reveal } from './Reveal';
import { SpotlightGrid } from './SpotlightGrid';
import { StatNumber } from './StatNumber';
import { BeamDiagram } from './BeamDiagram';
import { CodeTabs } from './CodeTabs';
import { FeatureCards } from './FeatureCards';
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
        {/* ---------------- FEATURE + TABBED CODE ---------------- */}
        <Reveal className="feat">
          <div className="feat-copy">
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
          <CodeTabs />
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

        {/* ---------------- BENTO GRID ---------------- */}
        <Reveal>
        <SpotlightGrid className="bento">
          {/* code tile — the reactive read */}
          <article className="cell cell--code s4" aria-hidden="true">
            <div className="code-head">
              <span className="file">concile/messages.ts</span>
              <span className="chip">reactive</span>
            </div>
            <pre>
              <code>
                <span className="tc">{'// a query is a pure, reactive read'}</span>
                {'\n'}
                <span className="tk">export const</span> <span className="tf">list</span>{' '}
                <span className="tp">=</span> <span className="tf">query</span>
                <span className="tp">({'{'}</span>
                {'\n  '}
                <span className="tf">args</span>
                <span className="tp">:</span> <span className="tp">{'{'}</span>{' '}
                <span className="tf">channelId</span>
                <span className="tp">:</span> <span className="tf">v</span>
                <span className="tp">.</span>
                <span className="tf">id</span>
                <span className="tp">(</span>
                <span className="ts">"channels"</span>
                <span className="tp">)</span> <span className="tp">{'}'}</span>
                <span className="tp">,</span>
                {'\n  '}
                <span className="tf">handler</span>
                <span className="tp">:</span> <span className="tp">(</span>
                <span className="tf">ctx</span>
                <span className="tp">,</span> <span className="tp">{'{'}</span>{' '}
                <span className="tf">channelId</span> <span className="tp">{'}'}</span>
                <span className="tp">)</span> <span className="tp">{'=>'}</span>
                {'\n    '}
                <span className="tf">ctx</span>
                <span className="tp">.</span>
                <span className="tf">db</span>
                <span className="tp">.</span>
                <span className="tk">query</span>
                <span className="tp">(</span>
                <span className="ts">"messages"</span>
                <span className="tp">,</span> <span className="ts">"by_channel"</span>
                <span className="tp">)</span>
                {'\n      '}
                <span className="tp">.</span>
                <span className="tk">eq</span>
                <span className="tp">(</span>
                <span className="ts">"channelId"</span>
                <span className="tp">,</span> <span className="tf">channelId</span>
                <span className="tp">)</span>
                <span className="tp">.</span>
                <span className="tk">collect</span>
                <span className="tp">(),</span>
                {'\n'}
                <span className="tp">{'}'})</span>
                <span className="tp">;</span>
                {'\n\n'}
                <span className="tc">{'// on the client, re-renders when a mutation commits'}</span>
                {'\n'}
                <span className="tk">const</span> <span className="tf">messages</span>{' '}
                <span className="tp">=</span> <span className="tf">useQuery</span>
                <span className="tp">(</span>
                <span className="tf">api</span>
                <span className="tp">.</span>
                <span className="tf">messages</span>
                <span className="tp">.</span>
                <span className="tf">list</span>
                <span className="tp">,</span> <span className="tp">{'{'}</span>{' '}
                <span className="tf">channelId</span> <span className="tp">{'}'}</span>
                <span className="tp">);</span>
              </code>
            </pre>
          </article>

          {/* reactive-loop tile */}
          <article className="cell s2">
            <span className="k">the reactive core</span>
            <h3>Data changes push themselves</h3>
            <p>Every query records what it read; every write is checked against it.</p>
            <div className="loop">
              <div className="loop-step">
                <span className="n">01</span>
                <span className="t">
                  <b>A client subscribes.</b> The engine records its read set.
                </span>
              </div>
              <div className="loop-step">
                <span className="n">02</span>
                <span className="t">
                  <b>A mutation commits</b> in one serializable transaction.
                </span>
              </div>
              <div className="loop-step">
                <span className="n">03</span>
                <span className="t">
                  <b>The result is pushed.</b> Only queries the write touched re-run.
                </span>
              </div>
            </div>
            <Link className="tlink" href="/docs/core-concepts/reactivity">
              Read about reactivity
            </Link>
          </article>

          {/* real stat tile */}
          <article className="cell cell--stat s2">
            <p className="stat">
              8.6<b>ms</b>
            </p>
            <p>
              Median reactive propagation in a same-substrate benchmark. Run it yourself before you
              trust it.
            </p>
            <Link className="tlink" href="/docs/get-started/performance">
              See the numbers
            </Link>
          </article>

          {/* capability tiles */}
          <article className="cell s2">
            <span className="k">components</span>
            <h3>Auth, scheduler, workflows</h3>
            <p>
              Opt-in components: authentication, cron and scheduled jobs, durable multi-step workflows
              with saga compensation, triggers, and notifications.
            </p>
          </article>

          <article className="cell s2">
            <span className="k">storage</span>
            <h3>SQLite or Postgres, plus files</h3>
            <p>
              Zero-config SQLite for local, Postgres when you need it, and built-in blob storage on the
              filesystem or any S3-compatible bucket.
            </p>
          </article>

          <article className="cell s2">
            <span className="k">the client</span>
            <h3>Optimistic and offline</h3>
            <p>
              A typed client with instant optimistic updates and a durable offline outbox that survives
              reloads, with exactly-once delivery on reconnect.
            </p>
          </article>

          <article className="cell s2">
            <span className="k">escape hatches</span>
            <h3>Actions, HTTP, crons</h3>
            <p>
              Actions run outside the transaction for fetch, timers, and randomness. Public HTTP
              endpoints handle webhooks.
            </p>
          </article>

          <article className="cell s2">
            <span className="k">dashboard</span>
            <h3>A live data browser</h3>
            <p>
              Browse and edit tables, watch logs, and run functions from a built-in dashboard that
              updates reactively.
            </p>
          </article>

          {/* deploy tile */}
          <article className="cell s3">
            <span className="k">your infrastructure</span>
            <h3>Runs where you run</h3>
            <p>
              One command in development. In production it is a single self-contained binary, a Docker
              image, or a Cloudflare deployment, backed by your own SQLite file or Postgres. No managed
              cloud in the loop, no vendor lock-in.
            </p>
            <div className="targets">
              <span>single binary</span>
              <span>docker</span>
              <span>cloudflare</span>
              <span>postgres</span>
            </div>
            <Link className="tlink" href="/docs/deploy/self-hosting">
              Self-hosting guide
            </Link>
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
                <b>Single-node writes</b>
                <span>One writer per shard. Multi-node scale-out is a later tier.</span>
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
