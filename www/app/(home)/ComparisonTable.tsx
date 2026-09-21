'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The "we took the good parts" matrix. Aceternity-style in mechanic, not in code:
// the column spotlight on hover and the highlighted first column are lifted from
// Card Hover Effect and the pricing blocks, but written against the .lp tokens
// because this page has no shadcn/Tailwind layer to hang their components on.
//
// Every claim here is a snapshot of each project's public docs on the date in
// CHECKED below. Two rows are deliberately not wins for us. A table where one
// column is all green reads as an advertisement and gets skipped.

const CHECKED = '21 September 2026';

type Mark = 'yes' | 'part' | 'no';
type Cell = { mark: Mark; note: string };
type Row = { axis: string; cells: Cell[] };

// Column order is the row order of every Cell[] below.
const PRODUCTS = ['Concile', 'Convex', 'Supabase', 'Firebase', 'PocketBase'];

const ROWS: Row[] = [
  {
    axis: 'Live results from your own server code',
    cells: [
      { mark: 'yes', note: 'Read-set precise' },
      { mark: 'yes', note: 'Cached, subscribable queries' },
      { mark: 'part', note: 'Row change events' },
      { mark: 'part', note: 'Document listeners' },
      { mark: 'part', note: 'Record events' },
    ],
  },
  {
    axis: 'Backend is plain TypeScript functions',
    cells: [
      { mark: 'yes', note: 'Query, mutation, action' },
      { mark: 'yes', note: 'Query, mutation, action' },
      { mark: 'part', note: 'Edge functions, off to the side' },
      { mark: 'part', note: 'Cloud Functions' },
      { mark: 'part', note: 'Go or JS hooks' },
    ],
  },
  {
    axis: 'Authorization is ordinary code, not a rules language',
    cells: [
      { mark: 'yes', note: 'Functions you can unit test' },
      { mark: 'yes', note: 'Ordinary TypeScript functions' },
      { mark: 'no', note: 'Row-level security in SQL' },
      { mark: 'no', note: 'Security rules DSL' },
      { mark: 'no', note: 'API rule expressions' },
    ],
  },
  {
    axis: 'Self-host the whole product',
    cells: [
      { mark: 'yes', note: 'One process, one command' },
      { mark: 'part', note: 'Open-source backend, cloud is the product' },
      { mark: 'part', note: 'Several composed services' },
      { mark: 'no', note: 'Google cloud only' },
      { mark: 'yes', note: 'One binary' },
    ],
  },
  {
    axis: 'Ships as a single binary with no database to run',
    cells: [
      { mark: 'yes', note: 'concile build' },
      { mark: 'no', note: '' },
      { mark: 'no', note: 'Postgres required' },
      { mark: 'no', note: '' },
      { mark: 'yes', note: 'SQLite embedded' },
    ],
  },
  {
    axis: 'Swap the database without touching app code',
    cells: [
      { mark: 'yes', note: 'SQLite or Postgres, one flag' },
      { mark: 'no', note: 'Fixed store' },
      { mark: 'no', note: 'Postgres only' },
      { mark: 'no', note: 'Firestore or Realtime Database' },
      { mark: 'no', note: 'SQLite only' },
    ],
  },
  {
    axis: 'Durable workflows with rollback',
    cells: [
      { mark: 'yes', note: 'Saga compensation' },
      { mark: 'part', note: 'Workflow component' },
      { mark: 'no', note: 'Bring your own' },
      { mark: 'no', note: 'Bring your own' },
      { mark: 'no', note: 'Bring your own' },
    ],
  },
  {
    axis: 'Offline writes that survive a reload',
    cells: [
      { mark: 'yes', note: 'Durable outbox, exactly once' },
      { mark: 'part', note: 'Optimistic updates only' },
      { mark: 'no', note: '' },
      { mark: 'yes', note: 'Firestore persistence' },
      { mark: 'no', note: '' },
    ],
  },
  {
    axis: 'Full-text and vector search',
    cells: [
      { mark: 'no', note: 'Not built yet' },
      { mark: 'yes', note: 'Both, built in' },
      { mark: 'yes', note: 'tsvector and pgvector' },
      { mark: 'part', note: 'Vector only, text needs an add-on' },
      { mark: 'part', note: 'Filter matching, no index' },
    ],
  },
];

const LABEL: Record<Mark, string> = { yes: 'Yes', part: 'Partly', no: 'No' };

function MarkIcon({ mark }: { mark: Mark }) {
  // Shape carries the meaning as well as colour, so the table still reads for
  // anyone who cannot separate the emerald from the muted grey.
  const d =
    mark === 'yes'
      ? 'M3 8.5 6.5 12 13 4'
      : mark === 'part'
        ? 'M3.5 8h9'
        : 'M4 4l8 8M12 4l-8 8';
  return (
    <svg className="cmt-ico" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ComparisonTable() {
  // The hovered column index, or null. This is the Aceternity column spotlight:
  // one piece of state, and the cells of that column light up together.
  const [lit, setLit] = useState<number | null>(null);

  // Whether there is more table to the right. Drives the edge fade, which would
  // otherwise sit over the last column once you have scrolled all the way.
  const [more, setMore] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 1);
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className={cls('cmt', more && 'is-scrollable')}>
      <p className="cmt-hint" aria-hidden="true">
        Swipe the table sideways to see every column
      </p>
      <div
        className="cmt-scroll"
        ref={scroller}
        onScroll={measure}
        onMouseLeave={() => setLit(null)}
      >
        <table className="cmt-table">
          <caption className="cmt-cap">
            How Concile compares to other backend-as-a-service tools
          </caption>
          <thead>
            <tr>
              <th scope="col" className="cmt-axis cmt-axis--head">
                <span className="cmt-sr">Capability</span>
              </th>
              {PRODUCTS.map((p, c) => (
                <th
                  scope="col"
                  key={p}
                  className={cls('cmt-h', c === 0 && 'is-us', lit === c && 'is-lit')}
                  onMouseEnter={() => setLit(c)}
                >
                  {p}
                  {c === 0 && <span className="cmt-badge">this one</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.axis}>
                <th scope="row" className="cmt-axis">
                  {row.axis}
                </th>
                {row.cells.map((cell, c) => (
                  <td
                    key={PRODUCTS[c]}
                    className={cls(
                      'cmt-c',
                      `is-${cell.mark}`,
                      c === 0 && 'is-us',
                      lit === c && 'is-lit',
                    )}
                    onMouseEnter={() => setLit(c)}
                  >
                    <MarkIcon mark={cell.mark} />
                    {/* the icon is decorative, so the state is named in text for
                        screen readers and then visually hidden */}
                    <span className="cmt-sr">{LABEL[cell.mark]}</span>
                    {cell.note && <span className="cmt-note">{cell.note}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="cmt-foot">
        Checked against each project&rsquo;s public documentation on {CHECKED}. These tools all move
        fast. If a cell is wrong or out of date,{' '}
        <a
          href="https://github.com/concile-dev/concile/issues/new"
          target="_blank"
          rel="noreferrer"
        >
          tell us and we will fix it
        </a>
        .
      </p>
    </div>
  );
}

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}
