'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import './editor-showcase.css';

// An interactive VSCode-style mockup: click files in the tree to switch tabs,
// and on messages.ts edit the message value + press Run to commit it live into
// the preview (the write -> reactive-push loop). Not a real editor engine.

const TERM = [
  { text: '$ npx concile dev', cls: 'ed-cmd' },
  { text: 'concile 0.1.5  ·  reactive backend', cls: 'ed-dim' },
  { text: '✓ watching concile/ for changes', cls: 'ed-ok' },
  { text: '✓ database ready (sqlite, 0 migrations)', cls: 'ed-ok' },
  { text: '✓ dashboard  →  http://localhost:3210', cls: 'ed-ok' },
  { text: '◍ live — open messages.ts, edit, then Run', cls: 'ed-liveline' },
];

const SEED = ['Ada joined #general', 'new order #1042'];

// static file contents (messages.ts is built in the component so it can hold the input)
const STATIC_FILES: Record<string, ReactNode[]> = {
  'schema.ts': [
    <><span className="k">import</span> {'{'} defineSchema, defineTable, v {'}'} <span className="k">from</span> <span className="s">&quot;concile/schema&quot;</span>;</>,
    <>&nbsp;</>,
    <><span className="k">export default</span> <span className="f">defineSchema</span>({'{'}</>,
    <>{'  '}messages: <span className="f">defineTable</span>({'{'}</>,
    <>{'    '}text: v.<span className="f">string</span>(),</>,
    <>{'    '}author: v.<span className="f">optional</span>(v.<span className="f">id</span>(<span className="s">&quot;users&quot;</span>)),</>,
    <>{'  '}{'}'}).<span className="f">index</span>(<span className="s">&quot;by_time&quot;</span>, [<span className="s">&quot;_creationTime&quot;</span>]),</>,
    <>{'}'});</>,
  ],
  'auth.ts': [
    <><span className="k">import</span> {'{'} defineAuth, Password, GitHub {'}'} <span className="k">from</span> <span className="s">&quot;@concile/auth&quot;</span>;</>,
    <>&nbsp;</>,
    <><span className="k">export const</span> {'{'} auth, handlers {'}'} = <span className="f">defineAuth</span>({'{'}</>,
    <>{'  '}providers: [<span className="f">Password</span>(), <span className="f">GitHub</span>()],</>,
    <>{'  '}session: {'{'} rememberMe: <span className="p">true</span> {'}'},</>,
    <>{'}'});</>,
  ],
  'Chat.tsx': [
    <><span className="k">import</span> {'{'} useQuery {'}'} <span className="k">from</span> <span className="s">&quot;concile/react&quot;</span>;</>,
    <><span className="k">import</span> {'{'} api {'}'} <span className="k">from</span> <span className="s">&quot;./_generated/api&quot;</span>;</>,
    <>&nbsp;</>,
    <><span className="k">export function</span> <span className="f">Chat</span>() {'{'}</>,
    <>{'  '}<span className="k">const</span> messages = <span className="f">useQuery</span>(api.messages.list);</>,
    <>{'  '}<span className="k">return</span> messages?.<span className="f">map</span>((m) {'=>'} <span className="p">&lt;p&gt;</span>{'{'}m.text{'}'}<span className="p">&lt;/p&gt;</span>);</>,
    <>{'}'}</>,
  ],
  'package.json': [
    <>{'{'}</>,
    <>{'  '}<span className="s">&quot;name&quot;</span>: <span className="s">&quot;concile-app&quot;</span>,</>,
    <>{'  '}<span className="s">&quot;dependencies&quot;</span>: {'{'}</>,
    <>{'    '}<span className="s">&quot;concile&quot;</span>: <span className="s">&quot;^0.1.5&quot;</span></>,
    <>{'  '}{'}'},</>,
    <>{'  '}<span className="s">&quot;scripts&quot;</span>: {'{'} <span className="s">&quot;dev&quot;</span>: <span className="s">&quot;concile dev&quot;</span> {'}'}</>,
    <>{'}'}</>,
  ],
  'concile.config.ts': [
    <><span className="k">import</span> {'{'} defineConfig {'}'} <span className="k">from</span> <span className="s">&quot;concile/config&quot;</span>;</>,
    <>&nbsp;</>,
    <><span className="k">export default</span> <span className="f">defineConfig</span>({'{'}</>,
    <>{'  '}functions: <span className="s">&quot;concile/&quot;</span>,</>,
    <>{'  '}database: <span className="s">&quot;sqlite&quot;</span>,{'  '}<span className="c">// or &quot;postgres&quot;</span></>,
    <>{'}'});</>,
  ],
};

const TREE = [
  { name: 'concile', folder: true },
  { name: 'messages.ts', indent: true },
  { name: 'schema.ts', indent: true },
  { name: 'auth.ts', indent: true },
  { name: 'app', folder: true },
  { name: 'Chat.tsx', indent: true },
  { name: 'package.json' },
  { name: 'concile.config.ts' },
];

/* VS Code puts a coloured file-type glyph on every row and it is most of what
   makes a tree read as an editor rather than as a list. Two letters in the mono
   face, tinted per extension, holds up at this size where a real icon set would
   turn to mush. */
function FileIcon({ name }: { name: string }) {
  const ext = name.endsWith('.tsx')
    ? 'tsx'
    : name.endsWith('.ts')
      ? 'ts'
      : name.endsWith('.json')
        ? 'json'
        : 'file';
  const label = ext === 'json' ? '{}' : ext === 'tsx' ? 'TS' : ext === 'ts' ? 'TS' : '\u2022';
  return <span className={`ed-ic ed-ic--${ext}`}>{label}</span>;
}

/* The activity bar. Files is the active view, so it carries the accent rail on
   its left edge exactly as VS Code draws it. */
const RAIL = [
  { id: 'files', d: 'M4 3h9l5 5v13H4z', active: true },
  { id: 'search', d: 'M11 4a7 7 0 1 0 4.2 12.6L20 21l1-1-4.4-4.8A7 7 0 0 0 11 4z' },
  { id: 'scm', d: 'M7 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm10 10a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM7 10v5a2 2 0 0 0 2 2h5' },
  // A plain play triangle. The real Run-and-Debug glyph is a bug with a play
  // button in it, which at 18px collapsed into an unreadable blob.
  { id: 'debug', d: 'M9 6.5l9 5.5-9 5.5z' },
  { id: 'ext', d: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
];

export function EditorShowcase() {
  const [line, setLine] = useState(1);
  const [tick, setTick] = useState(0);
  const [text, setText] = useState('gm from the docs');
  const [active, setActive] = useState('messages.ts');
  const [openTabs, setOpenTabs] = useState<string[]>(['messages.ts', 'Chat.tsx']);
  const [feed, setFeed] = useState<{ id: number; t: string }[]>(
    SEED.map((t, i) => ({ id: i, t })),
  );
  const [echo, setEcho] = useState<string[]>([]);
  const idRef = useRef(SEED.length);

  useEffect(() => {
    const id = setInterval(() => {
      setLine((l) => (l < TERM.length ? l + 1 : l));
    }, 850);
    return () => clearInterval(id);
  }, []);

  const booted = line >= TERM.length;
  const isMessages = active === 'messages.ts';

  function openFile(name: string) {
    setActive(name);
    setOpenTabs((t) => (t.includes(name) ? t : [...t, name]));
  }

  function commit() {
    const t = text.trim() || 'hello';
    setFeed((cur) => [...cur.slice(-3), { id: idRef.current++, t }]);
    // Result first, call second. The line is clipped rather than wrapped, and
    // the text is whatever was typed, so putting the message first meant a long
    // one ate the timing: "committed in 8.…". The ellipsis should land on the
    // payload, not on the proof.
    setEcho((e) => [...e.slice(-1), `✓ committed in 8.6ms  ·  add({ text: "${t}" })`]);
    setTick((x) => x + 1);
  }

  // rows for the active file (messages.ts holds the live input)
  const rows: ReactNode[] = isMessages
    ? [
        <><span className="k">import</span> {'{'} query, mutation {'}'} <span className="k">from</span> <span className="s">&quot;./_generated/server&quot;</span>;</>,
        <>&nbsp;</>,
        // The object form, `query({ handler })`, is the shipped signature. This
        // panel used to show the older positional `query(async (ctx) => ...)`,
        // which contradicted the steps section one screen below it.
        <><span className="k">export const</span> <span className="f">list</span> = <span className="f">query</span>({'{'}</>,
        <>{'  '}handler: (ctx) {'=>'} ctx.<span className="f">db</span>.<span className="f">query</span>(<span className="s">&quot;messages&quot;</span>).<span className="f">collect</span>(),</>,
        <>{'}'});</>,
        <>&nbsp;</>,
        <><span className="k">export const</span> <span className="f">add</span> = <span className="f">mutation</span>({'{'}</>,
        // The insert is broken across lines rather than kept on one. .ed-line is
        // white-space: pre, so the single-line form ran past the code column and
        // clipped the input, which is the only thing here you can actually touch.
        <>{'  '}handler: (ctx) {'=>'} ctx.<span className="f">db</span>.<span className="f">insert</span>(<span className="s">&quot;messages&quot;</span>, {'{'}</>,
        <>
          {'    '}text:{' '}
          <span className="ed-strq">&quot;</span>
          <input
            className="ed-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && booted) commit();
            }}
            spellCheck={false}
            size={Math.max(text.length, 6)}
            aria-label="message text to commit"
          />
          <span className="ed-strq">&quot;</span>,
        </>,
        <>{'  '}{'}'}),</>,
        <>{'}'});</>,
      ]
    : STATIC_FILES[active] ?? [<>&nbsp;</>];

  return (
    <div className="ed">
      <div className="ed-bar">
        <span className="ed-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="ed-title">concile-app</span>
        <span className="ed-bar-spacer" />
      </div>

      <div className="ed-body">
        <nav className="ed-rail" aria-hidden="true">
          {RAIL.map((r) => (
            <span key={r.id} className={`ed-rail-ic${r.active ? ' ed-active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d={r.d} />
              </svg>
            </span>
          ))}
        </nav>

        <aside className="ed-side">
          <div className="ed-side-h">
            Explorer
            <span className="ed-side-more">···</span>
          </div>
          <div className="ed-root">
            <span className="ed-chev">⌄</span> concile-app
          </div>
          {TREE.map((f) =>
            f.folder ? (
              <div key={f.name} className="ed-file ed-folder">
                <span className="ed-chev">⌄</span> {f.name}
              </div>
            ) : (
              <button
                key={f.name}
                type="button"
                className={`ed-file ed-filebtn${f.indent ? ' ed-in' : ''}${
                  active === f.name ? ' ed-active' : ''
                }`}
                onClick={() => openFile(f.name)}
              >
                <FileIcon name={f.name} />
                {f.name}
              </button>
            ),
          )}
          <div className="ed-side-foot">
            <span className="ed-chev ed-chev--closed">›</span> Outline
          </div>
          <div className="ed-side-foot">
            <span className="ed-chev ed-chev--closed">›</span> Timeline
          </div>
        </aside>

        <div className="ed-main">
          <div className="ed-tabs">
            {openTabs.map((name) => (
              <button
                key={name}
                type="button"
                className={`ed-tab${active === name ? ' ed-active' : ''}`}
                onClick={() => setActive(name)}
              >
                {name}
              </button>
            ))}
            {isMessages ? (
              <button
                type="button"
                className="ed-run"
                onClick={commit}
                disabled={!booted}
                title={booted ? 'Run this mutation' : 'starting dev server…'}
              >
                ▶ Run
              </button>
            ) : null}
          </div>
          <pre className="ed-code">
            <code>
              {rows.map((row, i) => (
                <div className="ed-row" key={`${active}-${i}`}>
                  <span className="ed-gutter">{i + 1}</span>
                  <span className="ed-line">{row}</span>
                </div>
              ))}
            </code>
          </pre>
          <div className="ed-term">
            <div className="ed-term-bar">
              <span>Problems</span>
              <span>Output</span>
              <span>Debug Console</span>
              <span className="ed-active">Terminal</span>
              <span>Ports</span>
            </div>
            <div className="ed-term-body">
              {TERM.slice(0, line).map((l, i) => (
                <div key={i} className={l.cls}>
                  {l.text}
                  {i === line - 1 && !booted ? <span className="ed-cursor" /> : null}
                </div>
              ))}
              {echo.map((e, i) => (
                <div key={`e${i}`} className="ed-liveline">
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ed-preview">
          <div className="ed-prev-bar">
            <span className="ed-prev-file">your app</span>
            <span className="ed-prev-live">
              <span className="ed-prev-dot" key={tick} />
              live
            </span>
          </div>
          <ul className="ed-prev-feed">
            {feed.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ y: -8, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 20%, transparent)' }}
                animate={{ y: 0, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 0%, transparent)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={i === feed.length - 1 ? 'is-new' : ''}
              >
                <span className="ed-prev-avatar" />
                {m.t}
              </motion.li>
            ))}
          </ul>
          <div className="ed-prev-cap">
            {isMessages
              ? booted
                ? 'edit the text, press Run, watch it land'
                : 'starting…'
              : 'the messages query, rendered live'}
          </div>
        </div>
      </div>

      <div className="ed-status" aria-hidden="true">
        <span className="ed-status-l">
          <span className="ed-branch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="7" cy="6" r="2.4" />
              <circle cx="7" cy="18" r="2.4" />
              <circle cx="17" cy="12" r="2.4" />
              <path d="M7 8.4v7.2M9.4 6H13a2 2 0 0 1 2 2v1.6" />
            </svg>
            main
          </span>
          <span>⊗ 0</span>
          <span>⚠ 0</span>
        </span>
        <span className="ed-status-r">
          <span>Ln 8, Col 24</span>
          <span>TypeScript</span>
          <span>UTF-8</span>
        </span>
      </div>
    </div>
  );
}
