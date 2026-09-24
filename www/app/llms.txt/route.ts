import { compare, source } from '@/lib/source';

export const revalidate = false;

// /llms.txt in the llmstxt.org shape: a title, a one-line summary, then one
// "## Section" per docs folder with "- [title](absolute url): description"
// entries. fumadocs' own llms() helper writes relative paths and nested
// bullets, which link checkers and most consumers reject, so this walks the
// page tree directly. /llms-full.txt still carries the page bodies.

const SITE = 'https://concile.dev';

type Node = {
  type: 'page' | 'folder' | 'separator';
  name?: unknown;
  description?: unknown;
  url?: string;
  index?: Node;
  children?: Node[];
};

const text = (v: unknown) => (typeof v === 'string' ? v : '');

function pageLine(node: Node): string {
  const desc = text(node.description);
  return `- [${text(node.name)}](${SITE}${node.url})${desc ? `: ${desc}` : ''}`;
}

function walk(nodes: Node[], out: string[]) {
  for (const node of nodes) {
    if (node.type === 'page') out.push(pageLine(node));
    if (node.type === 'folder') {
      out.push('', `## ${text(node.name)}`, '');
      if (node.index) out.push(pageLine(node.index));
      walk(node.children ?? [], out);
    }
    // Separators are sidebar headings ("Build", "Deploy & operate"); they carry
    // no pages of their own and mean nothing outside the sidebar.
  }
}

// A folder marked root: true in meta.json (Contributing) is its own sidebar
// tab, and fumadocs keeps it out of the main tree. Anything the walk did not
// reach is appended from the flat page list, grouped by top-level folder, so
// every docs page is listed exactly once.
function leftovers(seen: Set<string>, out: string[]) {
  const groups = new Map<string, string[]>();
  for (const page of source.getPages()) {
    if (seen.has(page.url)) continue;
    const key = page.slugs[0] ?? '';
    const title = key.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const list = groups.get(title) ?? [];
    list.push(pageLine({ type: 'page', name: page.data.title, description: page.data.description, url: page.url }));
    groups.set(title, list);
  }
  for (const [title, list] of groups) out.push('', `## ${title}`, '', ...list);
}

export function GET() {
  const lines = [
    '# Concile',
    '',
    '> The open-source realtime backend you host yourself. Database, live queries, auth, file storage, cron jobs and a dashboard in one binary. Write TypeScript, deploy anywhere.',
    '',
    `Full page bodies: ${SITE}/llms-full.txt`,
  ];
  walk(source.pageTree.children as Node[], lines);
  const seen = new Set(lines.flatMap((l) => (l.match(/\]\((https?:[^)]+)\)/) ? [l.match(/\]\((https?:[^)]+)\)/)![1].slice(SITE.length)] : [])));
  leftovers(seen, lines);
  lines.push('', '## Compare', '');
  for (const page of compare.getPages()) {
    lines.push(pageLine({ type: 'page', name: page.data.title, description: page.data.description, url: page.url }));
  }
  return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
