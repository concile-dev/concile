import type { ReactNode } from 'react';

/**
 * A very small TypeScript highlighter for the editor mockup.
 *
 * The panel used to carry its colours as hand-written spans in the JSX, which
 * meant most tokens were never marked at all: properties, parameters, numbers
 * and punctuation all fell through to one foreground colour, so a screenshot of
 * it read as grey text while the real editor it imitates is six or seven
 * distinct hues. Marking every token by hand across six files would not have
 * survived the first edit, so the files are plain strings now and this assigns
 * the classes.
 *
 * This is not a parser and does not need to be. The samples are a few lines of
 * well-formed TypeScript with no template-literal interpolation and no regex
 * literals, which are the two things a scanner this size gets wrong.
 *
 * Token classes follow VS Code's Dark+, so the panel reads as the editor it is
 * pretending to be. See editor-showcase.css for the values.
 */

// Colour-controlling keywords, split the way Dark+ splits them: flow control is
// the pink one, declarations and primitive types are the blue one.
const CONTROL = new Set([
  'import', 'from', 'export', 'default', 'return', 'if', 'else', 'for', 'while',
  'await', 'async', 'new', 'try', 'catch', 'throw', 'switch', 'case', 'break',
  'continue', 'yield', 'delete', 'in', 'of', 'instanceof', 'as',
]);

const STORAGE = new Set([
  'const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum',
  'extends', 'implements', 'public', 'private', 'protected', 'readonly',
  'static', 'void', 'string', 'number', 'boolean', 'bigint', 'symbol', 'object',
  'null', 'undefined', 'true', 'false', 'any', 'unknown', 'never', 'this', 'super',
]);

// Ordered alternation: comment, string, number, identifier, bracket, space, other.
const TOKEN =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\w.]*)|([A-Za-z_$][\w$]*)|([{}()[\]])|(\s+)|([^])/g;

// Bracket pair colorization cycles three colours by nesting depth. It is a large
// part of why a real editor looks colourful at a glance.
const BRACKET_DEPTHS = 3;

const JSX_TAG = /<\/?$/;

function classifyWord(word: string, prefix: string, after: string): string {
  // A member access is never a keyword. Without this, `v.string()` would be
  // painted as the primitive type rather than as the method call it is, which
  // is most of the identifiers in the schema sample.
  const member = prefix.endsWith('.');

  if (!member) {
    if (CONTROL.has(word)) return 'tk-key';
    // `type:` and friends are property names, not declarations.
    if (STORAGE.has(word)) return after === ':' ? 'tk-var' : 'tk-sto';
    // Matches both <p> and </p>: an intrinsic tag is blue, a component is a type.
    if (JSX_TAG.test(prefix)) return /^[A-Z]/.test(word) ? 'tk-type' : 'tk-sto';
  }

  // A call is the yellow one, which is what `query(`, `.collect(` and
  // `defineSchema(` all have in common.
  if (after === '(') return 'tk-fn';
  if (!member && /^[A-Z]/.test(word)) return 'tk-type';
  return 'tk-var';
}

/**
 * Highlights a block of lines. Bracket depth carries across them, so a brace
 * opened on one line still tints its partner several lines down.
 */
export function highlightLines(lines: string[]): ReactNode[][] {
  let depth = 0;

  return lines.map((line) => {
    // white-space: pre gives an empty line no height, and these blocks use
    // blank lines to breathe.
    if (line.trim() === '') return [' '];

    return Array.from(line.matchAll(TOKEN)).map((m, i) => {
      const [text, comment, str, num, word, bracket, space] = m;
      if (space) return text;

      const after = line.slice(m.index + text.length).trimStart().slice(0, 1);

      let cls: string;
      if (comment) cls = 'tk-com';
      // A quoted key is a property, not a value. This is what keeps
      // package.json from reading as one solid block of string colour.
      else if (str) cls = after === ':' ? 'tk-var' : 'tk-str';
      else if (num) cls = 'tk-num';
      else if (word) cls = classifyWord(word, line.slice(0, m.index).trimEnd(), after);
      else if (bracket) {
        const closing = text === '}' || text === ')' || text === ']';
        if (closing) depth = Math.max(0, depth - 1);
        cls = `tk-b${depth % BRACKET_DEPTHS}`;
        if (!closing) depth += 1;
      } else cls = 'tk-op';

      return (
        <span className={cls} key={i}>
          {text}
        </span>
      );
    });
  });
}
