'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useIntervalInView } from '@/lib/use-interval-in-view';
import { highlightLines } from '@/lib/highlight-ts';
import './editor-showcase.css';

// An interactive VSCode-style mockup: click files in the tree to switch tabs,
// and on messages.ts edit the message value + press Enter to commit it live into
// the preview (the write -> reactive-push loop). Not a real editor engine.

const TERM = [
  { text: '$ npx concile dev', cls: 'ed-cmd' },
  { text: 'concile 0.1.5  ·  reactive backend', cls: 'ed-dim' },
  { text: '✓ watching concile/ for changes', cls: 'ed-ok' },
  { text: '✓ database ready (sqlite, 0 migrations)', cls: 'ed-ok' },
  { text: '✓ dashboard  →  http://localhost:3210', cls: 'ed-ok' },
  { text: '◍ live — open messages.ts and edit the text', cls: 'ed-liveline' },
];


// Static file contents, as plain source. messages.ts is built in the component
// instead, because one of its lines holds the editable input.
const STATIC_FILES: Record<string, string[]> = {
  'schema.ts': [
    'import { defineSchema, defineTable, v } from "concile/schema";',
    '',
    'export default defineSchema({',
    '  messages: defineTable({',
    '    text: v.string(),',
    '    author: v.optional(v.id("users")),',
    '  }).index("by_time", ["_creationTime"]),',
    '});',
  ],
  'auth.ts': [
    'import { defineAuth, Password, GitHub } from "@concile/auth";',
    '',
    'export const { auth, handlers } = defineAuth({',
    '  providers: [Password(), GitHub()],',
    '  session: { rememberMe: true },',
    '});',
  ],
  'Chat.tsx': [
    'import { useQuery } from "concile/react";',
    'import { api } from "./_generated/api";',
    '',
    'export function Chat() {',
    '  const messages = useQuery(api.messages.list);',
    '  return messages?.map((m) => <p>{m.text}</p>);',
    '}',
  ],
  'package.json': [
    '{',
    '  "name": "concile-app",',
    '  "dependencies": {',
    '    "concile": "^0.1.5"',
    '  },',
    '  "scripts": { "dev": "concile dev" }',
    '}',
  ],
  'concile.config.ts': [
    'import { defineConfig } from "concile/config";',
    '',
    'export default defineConfig({',
    '  functions: "concile/",',
    '  database: "sqlite",  // or "postgres"',
    '});',
  ],
};

// messages.ts, the one file you can edit.
//
// The object form, query({ handler }), is the shipped signature. This panel used
// to show the older positional query(async (ctx) => ...), which contradicted the
// steps section one screen below it.
//
// The insert is broken across lines rather than kept on one. .ed-line is
// white-space: pre, so the single-line form ran past the code column and clipped
// the input, which is the only thing here you can actually touch.
const MESSAGES_SRC = [
  'import { query, mutation } from "./_generated/server";',
  '',
  'export const list = query({',
  '  handler: (ctx) => ctx.db.query("messages").collect(),',
  '});',
  '',
  'export const add = mutation({',
  '  handler: (ctx) => ctx.db.insert("messages", {',
  // Kept in the source so the highlighter's bracket depth stays in step. The
  // rendered row is replaced below, because the string holds the input.
  '    text: "",',
  '  }),',
  '});',
];

const MESSAGES_INPUT_LINE = 8;

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
  const [text, setText] = useState('gm from the docs');
  const [active, setActive] = useState('messages.ts');
  const [openTabs, setOpenTabs] = useState<string[]>(['messages.ts', 'Chat.tsx']);
  const [echo, setEcho] = useState<string[]>([]);

  const rootRef = useRef<HTMLDivElement>(null);
  const booted = line >= TERM.length;

  // Types the boot log out a line at a time. Two reasons this is gated: it should
  // not play while the hero is scrolled past, and once the log is fully printed
  // there is nothing left to advance, so the timer retires instead of waking the
  // main thread every 850ms for the life of the tab.
  useIntervalInView(
    rootRef,
    () => setLine((l) => (l < TERM.length ? l + 1 : l)),
    850,
    !booted,
  );
  const isMessages = active === 'messages.ts';

  function openFile(name: string) {
    setActive(name);
    setOpenTabs((t) => (t.includes(name) ? t : [...t, name]));
  }

  function commit() {
    const t = text.trim() || 'hello';
    // Result first, call second. The line is clipped rather than wrapped, and
    // the text is whatever was typed, so putting the message first meant a long
    // one ate the timing: "committed in 8.…". The ellipsis should land on the
    // payload, not on the proof.
    setEcho((e) => [...e.slice(-1), `✓ committed in 8.6ms  ·  add({ text: "${t}" })`]);
  }

  // rows for the active file (messages.ts holds the live input)
  const source = isMessages ? MESSAGES_SRC : STATIC_FILES[active] ?? [''];
  const rows: ReactNode[] = highlightLines(source).map((line, i) =>
    isMessages && i === MESSAGES_INPUT_LINE ? (
      // The one row the highlighter cannot produce: the string literal is an
      // input, so it is assembled by hand in the same token colours.
      <>
        {'    '}
        <span className="tk-var">text</span>
        <span className="tk-op">:</span>{' '}
        <span className="tk-str">&quot;</span>
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
        <span className="tk-str">&quot;</span>
        <span className="tk-op">,</span>
      </>
    ) : (
      line
    ),
  );

  return (
    <div className="ed" ref={rootRef}>
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
