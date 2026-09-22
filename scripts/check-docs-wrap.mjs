#!/usr/bin/env node
// Fails when docs prose is left unwrapped.
//
// Why this exists: a paragraph written on one long line makes every future
// diff useless. Change one word and git marks the whole paragraph as changed,
// so a reviewer cannot see what actually moved. The docs are wrapped at 100
// columns; this guards that.
//
// It only reports. It never rewrites, because reformatting MDX is not safe
// here: Prettier's MDX parser was measured against this tree and it split a
// paragraph around a bare `<adminKey>` inside an inline code span, which
// turned it into a JSX block and broke the build.
//
// Structure is skipped, because none of it can be wrapped: fenced code,
// tables, headings, JSX blocks, frontmatter, link definitions and indented
// component prop values.

import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const LIMIT = 120; // wrap target is 100; this is the slack before it is a bug.

const FENCE = /^\s*(```|~~~)/;
const HEADING = /^\s*#{1,6}\s/;
const TABLE = /^\s*\|/;
const JSX = /^\s*<\/?[A-Za-z][\w.-]*/;
const BLOCKQUOTE = /^\s*>/;
const INDENTED = /^ {4,}\S/; // component prop values, indented code
const LINKDEF = /^\s*\[[^\]]+\]:\s/;

function offenders(src) {
  const lines = src.split('\n');
  const out = [];
  let i = 0;

  if (lines[0]?.trim() === '---') {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '---') i++;
    i++;
  }

  let inFence = false;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence || !line.trim()) continue;
    if (
      HEADING.test(line) ||
      TABLE.test(line) ||
      JSX.test(line) ||
      BLOCKQUOTE.test(line) ||
      INDENTED.test(line) ||
      LINKDEF.test(line)
    ) {
      continue;
    }
    // A single unbreakable token (a long URL) cannot be wrapped.
    const longest = Math.max(...line.trim().split(/\s+/).map((w) => w.length));
    if (line.length > LIMIT && longest <= LIMIT) {
      out.push({ line: i + 1, len: line.length, text: line.trim().slice(0, 70) });
    }
  }
  return out;
}

const files = globSync('docs/**/*.mdx');
let total = 0;
for (const f of files.sort()) {
  for (const o of offenders(readFileSync(f, 'utf8'))) {
    console.error(`${f}:${o.line}  ${o.len} cols  ${o.text}...`);
    total++;
  }
}

if (total) {
  console.error(
    `\n${total} unwrapped prose line(s). Wrap docs prose at 100 columns so diffs stay readable.`,
  );
  process.exit(1);
}
console.log(`docs wrap OK (${files.length} files, limit ${LIMIT} cols)`);
