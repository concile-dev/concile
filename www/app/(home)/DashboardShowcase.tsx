'use client';

import { useEffect, useRef, useState } from 'react';
import { AreaChart, BarChart } from './DashboardCharts';
import { useIntervalInView } from '@/lib/use-interval-in-view';

// The Concile dashboard, as it appears when you run `concile dev`.
//
// Mirrors apps/dashboard: the sidebar from src/main.tsx and the data browser from
// src/features/data-browser.tsx. The nav really switches panes, so nothing here is
// a dead control.
//
// TODO: Analytics does not exist in apps/dashboard yet, and it is pinned above
// Tables here where the real sidebar has no such item. It is shown as roadmap.
// Either build it there or retitle this pane before it reads as a standing promise.

type View = 'data' | 'analytics' | 'functions' | 'logs';

const TABLES = [
  { name: 'messages', count: 1284 },
  { name: 'users', count: 128 },
  { name: 'orders', count: 1042 },
  { name: 'sessions', count: 87 },
];

type Row = { id: string; text: string; author: string; docId: string; at: string; fresh?: boolean };

// Fixed so server and client render the same first paint. Timestamps are restamped
// against the visitor's clock after mount.
const SEED: Row[] = [
  { id: 's1', text: 'gm from the docs', author: 'ada', docId: 'k57d2h9c4b1', at: '' },
  { id: 's2', text: 'new order #1042', author: 'system', docId: 'k57d2h6a920', at: '' },
  { id: 's3', text: 'Ada joined #general', author: 'system', docId: 'k57d2h1f77e', at: '' },
  { id: 's4', text: 'deploy finished in 8.6ms', author: 'ci', docId: 'k57d2gz0c43', at: '' },
  { id: 's5', text: 'invoice #8871 paid', author: 'system', docId: 'k57d2gx4e07', at: '' },
  { id: 's6', text: 'Kai joined #support', author: 'system', docId: 'k57d2gw1b55', at: '' },
  { id: 's7', text: 'cache warmed, 1.2k keys', author: 'ci', docId: 'k57d2gv8a12', at: '' },
  { id: 's8', text: 'new order #1041', author: 'system', docId: 'k57d2gt3f9d', at: '' },
  { id: 's9', text: 'backup written to r2', author: 'ci', docId: 'k57d2gs6c81', at: '' },
];

// Rows shown before the oldest scrolls off. Sized so the pager still clears the
// bottom bezel under the browser toolbar.
const VISIBLE = 9;

const NAMES = ['Grace', 'Kai', 'Ravi', 'Mei', 'Jonas', 'Priya', 'Tomas', 'Iris'];
const DEVICES = ['ios', 'android', 'web', 'cli'];
const HEX = 'abcdef0123456789';

function nextEvent(n: number): { text: string; author: string } {
  // Index by the cycle, not by n: within a branch n is always the same value mod
  // 4, so n % NAMES.length would only ever reach two of the eight names.
  const cycle = Math.floor(n / 4);
  switch (n % 4) {
    case 0:
      return { text: `new order #${1043 + cycle}`, author: 'system' };
    case 1:
      return { text: `${NAMES[cycle % NAMES.length]} joined #general`, author: 'system' };
    case 2:
      return { text: `deploy finished in ${(6 + ((cycle * 7) % 39) / 10).toFixed(1)}ms`, author: 'ci' };
    default:
      return { text: `session opened from ${DEVICES[cycle % DEVICES.length]}`, author: 'system' };
  }
}

function clockAt(secondsAgo: number): string {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return [d.getHours(), d.getMinutes(), d.getSeconds()].map((v) => String(v).padStart(2, '0')).join(':');
}

const FUNCTIONS = [
  { name: 'messages:list', kind: 'query', ms: 1.2 },
  { name: 'messages:add', kind: 'mutation', ms: 8.6 },
  { name: 'users:current', kind: 'query', ms: 0.9 },
  { name: 'orders:place', kind: 'mutation', ms: 12.4 },
  { name: 'email:send', kind: 'action', ms: 240 },
  { name: 'sessions:prune', kind: 'mutation', ms: 3.1 },
];

const SEED_TRAFFIC = [
  18, 22, 19, 27, 31, 26, 34, 29, 38, 41, 36, 44, 39, 47, 52, 46, 55, 49, 58, 62,
  54, 66, 59, 71, 64, 76, 68, 81, 73, 86, 78, 91, 83, 95, 88, 99, 92, 104, 97, 110,
];

const LATENCY = [
  { k: '00', v: 6.2 }, { k: '02', v: 5.8 }, { k: '04', v: 6.9 }, { k: '06', v: 7.4 },
  { k: '08', v: 9.1 }, { k: '10', v: 11.3 }, { k: '12', v: 10.2 }, { k: '14', v: 12.6 },
  { k: '16', v: 9.8 }, { k: '18', v: 8.4 }, { k: '20', v: 7.1 }, { k: '22', v: 6.5 },
];

export function DashboardShowcase() {
  const [view, setView] = useState<View>('data');
  const [table, setTable] = useState('messages');
  const [rows, setRows] = useState<Row[]>(SEED);
  const [count, setCount] = useState(1284);
  const [traffic, setTraffic] = useState<number[]>(SEED_TRAFFIC);
  const [logs, setLogs] = useState<string[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  // Handles for the per-row "fresh" highlights, so none of them outlive the mock.
  const fades = useRef(new Set<ReturnType<typeof setTimeout>>());
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setRows((prev) => prev.map((r, i) => ({ ...r, at: clockAt(18 + i * 23) })));
    setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const pending = fades.current;
    return () => {
      for (const id of pending) clearTimeout(id);
      pending.clear();
    };
  }, []);

  // This mock sits well down a very tall page and used to tick forever, which
  // meant re-rendering the whole dashboard every 3.2s while the reader was
  // nowhere near it. It now runs only while it is actually on screen.
  useIntervalInView(
    rootRef,
    () => {
      const next = nextEvent(seq.current);
      seq.current += 1;
      const n = seq.current;
      let docId = 'k57d2';
      for (let i = 0; i < 6; i += 1) docId += HEX[Math.floor(Math.random() * HEX.length)];
      const at = clockAt(0);

      setRows((prev) => [{ id: `r${n}`, ...next, docId, at, fresh: true }, ...prev].slice(0, VISIBLE));
      setCount((c) => c + 1);
      setTraffic((t) => [...t.slice(1), Math.max(12, t[t.length - 1] + Math.round((Math.random() - 0.45) * 18))]);
      setLogs((l) => [`${at}  mutation  ${next.text.slice(0, 30)}`, ...l].slice(0, 14));

      const fade = setTimeout(() => {
        fades.current.delete(fade);
        setRows((prev) => prev.map((r) => (r.id === `r${n}` ? { ...r, fresh: false } : r)));
      }, 1400);
      fades.current.add(fade);
    },
    3200,
    animate,
  );

  const openTable = (name: string) => {
    setTable(name);
    setView('data');
  };

  return (
    <div className="db" ref={rootRef}>
      <aside className="db-side">
        <div className="db-brand">
          <span className="db-bolt" aria-hidden="true">⚡</span> Concile
        </div>

        <button
          type="button"
          className={view === 'analytics' ? 'db-nav db-nav--on' : 'db-nav'}
          aria-current={view === 'analytics' ? 'page' : undefined}
          onClick={() => setView('analytics')}
        >
          <span className="db-cap">analytics</span>
        </button>

        <div className="db-sec">Tables</div>
        {TABLES.map((t) => {
          const on = view === 'data' && table === t.name;
          return (
            <button
              type="button"
              key={t.name}
              className={on ? 'db-nav db-nav--on' : 'db-nav'}
              aria-current={on ? 'page' : undefined}
              onClick={() => openTable(t.name)}
            >
              <span>{t.name}</span>
              <span className="db-badge">{(t.name === 'messages' ? count : t.count).toLocaleString()}</span>
            </button>
          );
        })}

        <div className="db-sec">Tools</div>
        {(['functions', 'logs'] as const).map((v) => (
          <button
            type="button"
            key={v}
            className={view === v ? 'db-nav db-nav--on' : 'db-nav'}
            aria-current={view === v ? 'page' : undefined}
            onClick={() => setView(v)}
          >
            <span className="db-cap">{v}</span>
          </button>
        ))}
      </aside>

      <main className="db-main">
        {view === 'data' && (
          <DataPane table={table} rows={rows} count={count} />
        )}

        {view === 'analytics' && (
          <>
            <div className="db-head">
              <h3 className="db-title">Analytics</h3>
              <span className="db-live"><i aria-hidden="true" /> live</span>
            </div>
            <div className="db-kpis">
              <Kpi label="writes / min" value={traffic[traffic.length - 1].toString()} delta="+12%" />
              <Kpi label="subscriptions" value="2,410" delta="+3%" />
              <Kpi label="p50 propagation" value="8.6ms" delta="-4%" />
              <Kpi label="documents" value={count.toLocaleString()} delta="+1%" />
            </div>
            <AreaChart points={traffic} label="Writes per minute" unit="/min" />
            <BarChart bars={LATENCY} label="p50 propagation by hour" unit="ms" />
          </>
        )}

        {view === 'functions' && (
          <>
            <div className="db-head">
              <h3 className="db-title">Functions</h3>
            </div>
            <div className="db-table">
              <div className="db-tr db-tr--head db-tr--fn">
                <span>name</span><span>kind</span><span>p50</span><span />
              </div>
              {FUNCTIONS.map((f) => (
                <div className="db-tr db-tr--fn" key={f.name}>
                  <span className="db-mono">{f.name}</span>
                  <span><span className={`db-kind is-${f.kind}`}>{f.kind}</span></span>
                  <span className="db-mono db-dim">{f.ms}ms</span>
                  <span className="db-acts"><span className="db-btn db-btn--sec">Run</span></span>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'logs' && (
          <>
            <div className="db-head">
              <h3 className="db-title">Logs</h3>
              <span className="db-live"><i aria-hidden="true" /> streaming</span>
            </div>
            <div className="db-logs">
              {logs.length === 0 ? (
                <div className="db-logline db-dim">waiting for traffic…</div>
              ) : (
                logs.map((l, i) => <div className="db-logline" key={i}>{l}</div>)
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="db-kpi">
      <span className="db-kpi-l">{label}</span>
      <b className="db-kpi-v">{value}</b>
      <span className="db-kpi-d">{delta}</span>
    </div>
  );
}

function DataPane({ table, rows, count }: { table: string; rows: Row[]; count: number }) {
  return (
    <>
      <div className="db-head">
        <h3 className="db-title">{table}</h3>
        <span className="db-btn db-btn--primary">+ New</span>
        <span className="db-live"><i aria-hidden="true" /> live</span>
      </div>

      <div className="db-filter" aria-hidden="true">
        <span className="db-select">text</span>
        <span className="db-select">eq</span>
        <span className="db-value">value</span>
        <span className="db-btn db-btn--sec db-x">✕</span>
      </div>

      <div className="db-table">
        <div className="db-tr db-tr--head">
          <span>text</span><span>author</span><span>_id</span><span>_creationTime</span><span />
        </div>
        {rows.map((r) => (
          <div className={r.fresh ? 'db-tr is-fresh' : 'db-tr'} key={r.id}>
            <span className="db-text">{r.text}</span>
            <span className="db-dim">{r.author}</span>
            <span className="db-mono">{r.docId}</span>
            <span className="db-mono db-dim">{r.at}</span>
            <span className="db-acts">
              <span className="db-btn db-btn--sec">Edit</span>
              <span className="db-btn db-btn--del">Del</span>
            </span>
          </div>
        ))}
      </div>

      <div className="db-foot">
        <span>{rows.length} of {count.toLocaleString()} documents</span>
        <span className="db-page">
          <span className="db-btn db-btn--sec is-off">Prev</span>
          <span className="db-btn db-btn--sec">Next</span>
        </span>
      </div>
    </>
  );
}
