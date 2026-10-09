const START = "<!-- concile:start -->";
const END = "<!-- concile:end -->";

function eol(text: string): string {
  return text.includes("\r\n") ? "\r\n" : "\n";
}
function withTrailingEol(text: string, nl: string): string {
  return text === "" || text.endsWith("\n") ? text : text + nl;
}
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function envHasKey(text: string, key: string): boolean {
  return new RegExp(`^\\s*(export\\s+)?${escapeRe(key)}\\s*=`, "m").test(text);
}

export function mergeEnv(text: string, keys: { key: string; value: string; comment?: string }[]): string {
  const nl = eol(text);
  let out = withTrailingEol(text, nl);
  for (const k of keys) {
    if (envHasKey(out, k.key)) continue;
    if (k.comment) out += `# ${k.comment}${nl}`;
    out += `${k.key}=${k.value}${nl}`;
  }
  return out;
}

function globToRe(glob: string): RegExp {
  return new RegExp("^" + glob.split("*").map(escapeRe).join(".*") + "$");
}

function gitignoreState(text: string, entry: string): { ignored: boolean; negated: boolean } {
  const target = entry.replace(/\/$/, "");
  let ignored = false;
  let negated = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const neg = line.startsWith("!");
    const pat = (neg ? line.slice(1) : line).replace(/^\//, "").replace(/\/$/, "");
    if (pat !== target && !globToRe(pat).test(target)) continue;
    ignored = !neg;
    if (neg) negated = true;
  }
  return { ignored, negated };
}

// Last matching line wins, so a later "!pattern" un-ignores the entry.
export function gitignoreCovers(text: string, entry: string): boolean {
  return gitignoreState(text, entry).ignored;
}

// True when a "!pattern" line in the file matches the entry (user re-included it).
export function gitignoreNegates(text: string, entry: string): boolean {
  return gitignoreState(text, entry).negated;
}

export function mergeGitignore(text: string, entries: string[]): string {
  // Respect an explicit "!" re-include: never append an entry the user negated.
  const missing = entries.filter((e) => {
    return !gitignoreCovers(text, e) && !gitignoreNegates(text, e);
  });
  if (missing.length === 0) return text;
  const nl = eol(text);
  const base = withTrailingEol(text, nl);
  return `${base}${base ? nl : ""}# concile${nl}${missing.join(nl)}${nl}`;
}

// Block bodies are wrapped with the file's own line ending (LF inside
// the block text is converted), so CRLF files stay consistently CRLF.
function wrap(block: string, nl: string): string {
  return [START, ...block.split(/\r?\n/), END].join(nl);
}

export function hasBlock(text: string, block: string): boolean {
  return text.includes(wrap(block, "\n")) || text.includes(wrap(block, "\r\n"));
}

export function upsertBlock(text: string, block: string): string {
  const nl = eol(text);
  const wrapped = wrap(block, nl);
  const starts = text.split(START).length - 1;
  const ends = text.split(END).length - 1;
  if (starts === 0 && ends === 0) {
    // fall through to append
  } else if (starts === 1 && ends === 1 && text.indexOf(END) > text.indexOf(START)) {
    const si = text.indexOf(START);
    return text.slice(0, si) + wrapped + text.slice(text.indexOf(END, si) + END.length);
  } else {
    return text; // malformed markers: never touch user content
  }
  const base = withTrailingEol(text, nl);
  return `${base}${base ? nl : ""}${wrapped}${nl}`;
}
