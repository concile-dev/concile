import type { ReactNode } from 'react';

// The "how it works" rail. A server component on purpose: there is no state
// here, unlike the tabbed CodeTabs block this replaced. All five snippets are
// on screen at once, so nothing is a click away.
//
// Snippets track the shipped API (`mutation({ args, handler })`), not the older
// positional form. See docs/core-concepts/{schema-and-tables,mutations,queries}.mdx.
type Step = { label: string; title: string; body: string; file: string; node: ReactNode };

const STEPS: Step[] = [
  {
    label: 'start with the shape',
    title: 'Describe your data',
    body: 'One file names your tables and their fields. A write that does not match is rejected before it lands.',
    file: 'concile/schema.ts',
    node: (
      <>
        <span className="k">export default</span> <span className="f">defineSchema</span>(
        {'{'}
        {'\n  '}messages: <span className="f">defineTable</span>({'{'}
        {'\n    '}body: <span className="f">v</span>.<span className="f">string</span>(),
        {'\n    '}done: <span className="f">v</span>.<span className="f">boolean</span>(),
        {'\n  '}{'}'}).<span className="f">index</span>(<span className="s">&quot;by_done&quot;</span>, [
        <span className="s">&quot;done&quot;</span>]),
        {'\n'}
        {'}'});
      </>
    ),
  },
  {
    label: 'a write is one transaction',
    title: 'Write a mutation',
    body: 'No resolvers and no glue. Args are checked first, then the handler runs against a snapshot.',
    file: 'concile/messages.ts',
    node: (
      <>
        <span className="k">export const</span> <span className="f">add</span> ={' '}
        <span className="f">mutation</span>({'{'}
        {'\n  '}args: {'{'} body: <span className="f">v</span>.<span className="f">string</span>() {'}'},
        {'\n  '}handler: (ctx, args) {'=>'}
        {'\n    '}ctx.<span className="f">db</span>.<span className="f">insert</span>(
        <span className="s">&quot;messages&quot;</span>, {'{'}
        {'\n      '}body: args.body,
        {'\n      '}done: <span className="p">false</span>,
        {'\n    '}{'}'}),
        {'\n'}
        {'}'});
      </>
    ),
  },
  {
    label: 'a read is pure',
    title: 'Read it with a query',
    body: 'A query only reads. Concile records what it touched, so it knows when the answer has changed.',
    file: 'concile/messages.ts',
    node: (
      <>
        <span className="k">export const</span> <span className="f">list</span> ={' '}
        <span className="f">query</span>({'{'}
        {'\n  '}args: {'{}'},
        {'\n  '}handler: (ctx) {'=>'}
        {'\n    '}ctx.<span className="f">db</span>.<span className="f">query</span>(
        <span className="s">&quot;messages&quot;</span>, <span className="s">&quot;by_creation&quot;</span>).
        <span className="f">collect</span>(),
        {'\n'}
        {'}'});
      </>
    ),
  },
  {
    label: 'the client just reads',
    title: 'Subscribe from the client',
    body: 'The hook holds the subscription open. Every commit re-renders every client that read it.',
    file: 'app/Chat.tsx',
    node: (
      <>
        <span className="k">const</span> messages = <span className="f">useQuery</span>(api.
        <span className="f">messages</span>.<span className="f">list</span>);
        {'\n'}
        <span className="c">{'// the component re-renders on every commit'}</span>
      </>
    ),
  },
  {
    label: 'one binary or a container',
    title: 'Ship it',
    body: 'The same code runs in dev, in a container, and as a static binary. Nothing is rewritten on the way out.',
    file: 'terminal',
    node: (
      <>
        <span className="p">$</span> npx concile dev{'     '}
        <span className="c"># live sync + dashboard</span>
        {'\n'}
        <span className="p">$</span> docker compose up{'   '}
        <span className="c"># one container, one volume</span>
        {'\n'}
        <span className="p">$</span> concile build{'       '}
        <span className="c"># a single binary</span>
      </>
    ),
  },
];

export function Steps() {
  return (
    <ol className="stp-list">
      {STEPS.map((step, i) => (
        <li className="stp-item" key={step.title}>
          {/* the <ol> already carries the ordering; the disc is decoration */}
          <span className="stp-node" aria-hidden="true">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="stp-label">{step.label}</span>
          <h3 className="stp-title">{step.title}</h3>
          <p className="stp-body">{step.body}</p>
          <div className="stp-code">
            <div className="stp-file">{step.file}</div>
            <pre>
              <code>{step.node}</code>
            </pre>
          </div>
        </li>
      ))}
    </ol>
  );
}
