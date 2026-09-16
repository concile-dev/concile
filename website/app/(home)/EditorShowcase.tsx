'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';

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
    setEcho((e) => [...e.slice(-1), `→ add({ text: "${t}" })  ✓ committed in 8.6ms`]);
    setTick((x) => x + 1);
  }

  // rows for the active file (messages.ts holds the live input)
  const rows: ReactNode[] = isMessages
    ? [
        <><span className="k">import</span> {'{'} query, mutation {'}'} <span className="k">from</span> <span className="s">&quot;./_generated/server&quot;</span>;</>,
        <>&nbsp;</>,
        <><span className="k">export const</span> <span className="f">list</span> = <span className="f">query</span>(<span className="p">async</span> (ctx) {'=>'}</>,
        <>{'  '}ctx.<span className="f">db</span>.<span className="f">query</span>(<span className="s">&quot;messages&quot;</span>).<span className="f">collect</span>());</>,
        <>&nbsp;</>,
        <><span className="k">export const</span> <span className="f">add</span> = <span className="f">mutation</span>(<span className="p">async</span> (ctx) {'=>'} {'{'}</>,
        <>
          {'  '}<span className="p">await</span> ctx.<span className="f">db</span>.<span className="f">insert</span>(<span className="s">&quot;messages&quot;</span>, {'{'} text:{' '}
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
          <span className="ed-strq">&quot;</span> {'}'})
        </>,
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
        <span className="ed-title">concile — dev</span>
        <span className="ed-bar-spacer" />
      </div>

      <div className="ed-body">
        <aside className="ed-side">
          <div className="ed-side-h">CONCILE-APP</div>
          {TREE.map((f) =>
            f.folder ? (
              <div key={f.name} className="ed-file ed-folder">
                ▾ {f.name}
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
                {f.name}
              </button>
            ),
          )}
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
              <span className="ed-active">Terminal</span>
              <span>Problems</span>
              <span>Output</span>
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
            <span className="hx-file">your app</span>
            <span className="hx-live">
              <span className="hx-live-dot" key={tick} />
              live
            </span>
          </div>
          <ul className="hx-feed">
            {feed.map((m, i) => (
              <motion.li
                key={m.id}
                initial={{ y: -8, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 20%, transparent)' }}
                animate={{ y: 0, backgroundColor: 'color-mix(in srgb, var(--accent-foreground) 0%, transparent)' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={i === feed.length - 1 ? 'is-new' : ''}
              >
                <span className="hx-avatar" />
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
    </div>
  );
}
