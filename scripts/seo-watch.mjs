// Weekly technical SEO watch. Crawls the live site with the `seo` CLI and
// compares the per-rule issue counts with the committed baseline, so a lost
// canonical, a new redirect chain, a 404 in the sitemap or a missing share
// image is caught within a week instead of by accident.
//
//   node scripts/seo-watch.mjs            compare with .github/seo-baseline.json
//   node scripts/seo-watch.mjs --write    rewrite the baseline from this crawl
//
// A regression is: any rule whose count rose, any rule not in the baseline,
// any page with a status error, or fewer pages than the baseline (a section
// dropped out of the crawl). Exits 1 on regression; the workflow opens an
// issue. Deliberate changes rerun with --write and commit the new baseline.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SITE = process.env.SEO_WATCH_SITE ?? 'https://concile.dev/';
const BASELINE = new URL('../.github/seo-baseline.json', import.meta.url);
const write = process.argv.includes('--write');

const raw = execFileSync('seo', ['crawl', SITE, '--severity', 'low', '--max-pages', '150', '--json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const crawl = JSON.parse(raw);

const counts = {};
for (const issue of crawl.issues ?? []) counts[issue.ruleId] = (counts[issue.ruleId] ?? 0) + 1;
const current = {
  pages: crawl.summary?.totalPages ?? 0,
  statusErrors: crawl.summary?.statusErrors ?? 0,
  rules: Object.fromEntries(Object.entries(counts).sort()),
};

if (write) {
  writeFileSync(BASELINE, JSON.stringify(current, null, 2) + '\n');
  console.log('baseline written', current);
  process.exit(0);
}

const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const problems = [];
if (current.statusErrors > 0) problems.push(`${current.statusErrors} page(s) returned an error status`);
if (current.pages < base.pages) problems.push(`crawled ${current.pages} pages, baseline ${base.pages}`);
for (const [rule, n] of Object.entries(current.rules)) {
  const was = base.rules[rule];
  if (was === undefined) problems.push(`new rule ${rule}: ${n}`);
  else if (n > was) problems.push(`${rule}: ${n}, baseline ${was}`);
}

console.log(`pages ${current.pages} (baseline ${base.pages}), status errors ${current.statusErrors}`);
for (const [rule, n] of Object.entries(current.rules)) console.log(`  ${rule}: ${n} (baseline ${base.rules[rule] ?? 'none'})`);
if (problems.length) {
  console.log('\nREGRESSIONS');
  for (const p of problems) console.log('  - ' + p);
  writeFileSync('seo-watch-report.md', `Crawl of ${SITE} on ${new Date().toISOString().slice(0, 10)}\n\n${problems.map((p) => `- ${p}`).join('\n')}\n\nPer rule:\n${Object.entries(current.rules).map(([r, n]) => `- ${r}: ${n} (baseline ${base.rules[r] ?? 'none'})`).join('\n')}\n`);
  process.exit(1);
}
console.log('\nno regressions');
