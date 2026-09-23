// The display wordmark: "concile" drawn in the mark's own cells.
//
// This is the large, stand-alone form of the name, for hero moments, the footer
// band and social cards. It is not the everyday lockup. Below about 48px the
// cells fall under two pixels and the word turns to noise before the mark
// does, so headers, favicons and READMEs use the Inter lockup instead. The
// brand page states the rule; this component just draws the word.
//
// Same glyph table as public/brand/concile-display-wordmark*.svg, so the site
// and the downloads cannot drift. A 7-row lowercase on the mark's 8-unit pitch:
// x-height on rows 2 to 6, ascenders from row 0, and the i-dot is the one
// violet cell, the same cell the mark uses.

const GLYPHS: Record<string, string[]> = {
  c: ['', '', '.XXX', 'X...', 'X...', 'X...', '.XXX'],
  o: ['', '', '.XX.', 'X..X', 'X..X', 'X..X', '.XX.'],
  n: ['', '', 'XXX.', 'X..X', 'X..X', 'X..X', 'X..X'],
  i: ['V', '', 'X', 'X', 'X', 'X', 'X'],
  l: ['X', 'X', 'X', 'X', 'X', 'X', 'X'],
  e: ['', '', '.XX.', 'X..X', 'XXXX', 'X...', '.XXX'],
};

const WORD = 'concile';
const PITCH = 8;
const CELL = 7;

type Cell = { x: number; y: number; violet: boolean };

const CELLS: Cell[] = [];
let cursor = 0;
for (const ch of WORD) {
  const glyph = GLYPHS[ch];
  const width = Math.max(...glyph.map((row) => row.length));
  glyph.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      if (cell === 'X' || cell === 'V') CELLS.push({ x: cursor + c, y: r, violet: cell === 'V' });
    });
  });
  cursor += width + 1;
}
const WIDTH = (cursor - 1) * PITCH + CELL;
const HEIGHT = 6 * PITCH + CELL;

export function BrandWordmark({ height = 56, className }: { height?: number; className?: string }) {
  const width = (WIDTH / HEIGHT) * height;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="concile"
      focusable="false"
    >
      {CELLS.map((c, i) => (
        <rect
          key={i}
          x={c.x * PITCH}
          y={c.y * PITCH}
          width={CELL}
          height={CELL}
          rx={1.3}
          fill={c.violet ? 'var(--brand-violet)' : 'currentColor'}
        />
      ))}
    </svg>
  );
}
