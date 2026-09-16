'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Tab = { id: string; label: string; file: string; raw: string; node: ReactNode };

const TABS: Tab[] = [
  {
    id: 'define',
    label: 'define',
    file: 'concile/messages.ts',
    raw: `export const add = mutation(async (ctx, { text }) => {\n  await ctx.db.insert("messages", { text, done: false });\n});`,
    node: (
      <>
        <span className="k">export const</span> <span className="f">add</span> ={' '}
        <span className="f">mutation</span>(<span className="p">async</span> (ctx, {'{'} text {'}'}) {'=>'} {'{'}
        {'\n  '}
        <span className="p">await</span> ctx.<span className="f">db</span>.<span className="f">insert</span>(
        <span className="s">&quot;messages&quot;</span>, {'{'} text, done: <span className="p">false</span> {'}'});
        {'\n'}
        {'}'});
      </>
    ),
  },
  {
    id: 'subscribe',
    label: 'subscribe',
    file: 'app/Chat.tsx',
    raw: `export const list = query(async (ctx) =>\n  ctx.db.query("messages").collect()\n);\n\n// client re-renders on every commit\nconst messages = useQuery(api.messages.list);`,
    node: (
      <>
        <span className="k">export const</span> <span className="f">list</span> ={' '}
        <span className="f">query</span>(<span className="p">async</span> (ctx) {'=>'}
        {'\n  '}ctx.<span className="f">db</span>.<span className="f">query</span>(
        <span className="s">&quot;messages&quot;</span>).<span className="f">collect</span>()
        {'\n'});{'\n\n'}
        <span className="c">{'// client re-renders on every commit'}</span>
        {'\n'}
        <span className="k">const</span> messages = <span className="f">useQuery</span>(api.
        <span className="f">messages</span>.<span className="f">list</span>);
      </>
    ),
  },
  {
    id: 'deploy',
    label: 'deploy',
    file: 'terminal',
    raw: `$ npx concile dev      # live sync + dashboard\n$ docker compose up    # one container, one volume\n$ concile build        # a single binary`,
    node: (
      <>
        <span className="p">$</span> npx concile dev{'      '}
        <span className="c"># live sync + dashboard</span>
        {'\n'}
        <span className="p">$</span> docker compose up{'    '}
        <span className="c"># one container, one volume</span>
        {'\n'}
        <span className="p">$</span> concile build{'        '}
        <span className="c"># a single binary</span>
      </>
    ),
  },
];

export function CodeTabs() {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const tab = TABS[active];

  async function copy() {
    try {
      await navigator.clipboard.writeText(tab.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked; ignore
    }
  }

  return (
    <div className="ctabs">
      <div className="ctabs-bar">
        <div className="ctabs-tabs">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              className={`ctabs-tab${i === active ? ' is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" className="ctabs-copy" onClick={copy}>
          {copied ? 'copied ✓' : 'copy'}
        </button>
      </div>
      <div className="ctabs-file">{tab.file}</div>
      <AnimatePresence mode="wait">
        <motion.pre
          key={tab.id}
          className="ctabs-code"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          <code>{tab.node}</code>
        </motion.pre>
      </AnimatePresence>
    </div>
  );
}
