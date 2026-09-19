'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

// A feature grid where each card carries its own small, live visualization
// (Concile's take on the Neon-style feature row). One shared 2.4s tick drives
// the animated ones; the rest are static mocks. All original.
export function FeatureCards() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fc-grid">
      <Card k="reactivity" title="Queries that stay live">
        <ReactiveViz tick={tick} />
      </Card>
      <Card k="scale" title="Thousands of live subscribers">
        <SparkViz />
      </Card>
      <Card k="scheduler" title="Cron and durable jobs">
        <SchedViz tick={tick} />
      </Card>
      <Card k="auth" title="Sign-in, built in">
        <AuthViz />
      </Card>
      <Card k="storage" title="Files on disk or S3">
        <StorageViz />
      </Card>
      <Card k="dashboard" title="A live data browser">
        <DashViz tick={tick} />
      </Card>
    </div>
  );
}

// Original emerald line-icons, one per feature. Drawn from simple geometry
// (no third-party icon set), keyed by the card's eyebrow.
const ICONS: Record<string, ReactNode> = {
  reactivity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M16.5 7.5a6.5 6.5 0 0 1 0 9" />
      <path d="M7.5 16.5a6.5 6.5 0 0 1 0-9" />
      <path d="M19.5 4.5a11 11 0 0 1 0 15" opacity=".45" />
      <path d="M4.5 19.5a11 11 0 0 1 0-15" opacity=".45" />
    </svg>
  ),
  scale: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 16 8 11 12 14 21 5" />
      <path d="M21 5v5" />
      <path d="M16 5h5" />
    </svg>
  ),
  scheduler: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  auth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.4-3 7-7 8-4-1-7-3.6-7-8V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  storage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 9v12" />
    </svg>
  ),
};

function Card({ k, title, children }: { k: string; title: string; children: ReactNode }) {
  return (
    <article className="fc-card">
      <div className="fc-ic">{ICONS[k]}</div>
      <span className="fc-k">{k}</span>
      <h3 className="fc-title">{title}</h3>
      <div className="fc-viz">{children}</div>
    </article>
  );
}

/* reactivity: a query result count that ticks up and flashes on change */
function ReactiveViz({ tick }: { tick: number }) {
  const n = 1284 + tick;
  return (
    <div className="fc-reactive">
      <span className="fc-mono">messages.count()</span>
      <motion.span
        key={tick}
        className="fc-num"
        // flash in the pulse colour, settle on the theme's foreground so the
        // number stays readable in both light and dark
        initial={{ color: 'var(--accent-foreground)' }}
        animate={{ color: 'var(--foreground)' }}
        transition={{ duration: 0.8 }}
      >
        {n.toLocaleString('en-US')}
      </motion.span>
      <span className="fc-mono fc-dim">rows, live</span>
    </div>
  );
}

/* scale: a sparkline with a pulsing head */
function SparkViz() {
  return (
    <div className="fc-spark-wrap">
      <svg viewBox="0 0 100 40" className="fc-spark" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points="0,34 13,29 26,31 39,20 52,24 65,12 78,17 92,7 100,9"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        <motion.circle
          cx="92"
          cy="7"
          r="2.6"
          fill="var(--accent-foreground)"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
      <span className="fc-mono">
        <b>2,000</b> online · 21 KB each
      </span>
    </div>
  );
}

/* scheduler: a timeline whose active tick advances and pulses */
function SchedViz({ tick }: { tick: number }) {
  const active = tick % 6;
  return (
    <div className="fc-sched">
      <div className="fc-timeline">
        <span className="fc-track" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`fc-tdot${i === active ? ' is-on' : ''}`} />
        ))}
      </div>
      <span className="fc-mono">cron · retries · runs at 00:00</span>
    </div>
  );
}

/* auth: a compact sign-in mock (static, original) */
function AuthViz() {
  return (
    <div className="fc-auth">
      <span className="fc-field">you@example.com</span>
      <span className="fc-field fc-dots">••••••••••</span>
      <span className="fc-auth-btn">Sign in</span>
    </div>
  );
}

/* storage: a small file tree */
function StorageViz() {
  return (
    <div className="fc-tree fc-mono">
      <div>▾ uploads/</div>
      <div className="fc-indent">avatar.png</div>
      <div className="fc-indent">report.pdf</div>
      <div>▾ backups/</div>
      <div className="fc-indent">2026-09-14.db</div>
    </div>
  );
}

/* dashboard: a mini table with a status cell that updates live */
function DashViz({ tick }: { tick: number }) {
  const states = ['queued', 'running', 'done'];
  const s = states[tick % states.length];
  return (
    <table className="fc-table fc-mono">
      <tbody>
        <tr>
          <td>#1041</td>
          <td>deploy</td>
          <td>
            <motion.span
              key={tick}
              className="fc-badge"
              initial={{ backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 28%, transparent)' }}
              animate={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}
              transition={{ duration: 0.8 }}
            >
              {s}
            </motion.span>
          </td>
        </tr>
        <tr>
          <td>#1040</td>
          <td>build</td>
          <td>
            <span className="fc-badge">done</span>
          </td>
        </tr>
        <tr>
          <td>#1039</td>
          <td>seed</td>
          <td>
            <span className="fc-badge">done</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
