// The Concile mark, inline.
//
// One source of truth for the 8x7 cell bitmap, so the header, the navbar and the
// brand page can never drift from the files in public/brand. Ink cells take
// currentColor, so the mark follows whatever text colour surrounds it. The
// reconciled cell is the one fixed colour, --brand-violet, which global.css
// sets per theme.
//
// The bitmap: a pixel "c" whose open side dissolves into smaller dither cells,
// and a single violet cell arriving to close it. The name comes from
// "reconcile", and that cell is the piece that makes the state whole.

const ROWS = [
  '..XXXXh.',
  '.XXXXXhq',
  'XX....hq',
  'XX.....V',
  'XX....hq',
  '.XXXXXhq',
  '..XXXXh.',
] as const;

const PITCH = 8;
const CELL = 7;
const OX = 0.5;
const OY = 4.5;
const SIZE: Record<string, number> = { X: CELL, V: CELL, h: 4.4, q: 2.6 };

type Cell = { x: number; y: number; s: number; violet: boolean };

const CELLS: Cell[] = [];
ROWS.forEach((row, r) => {
  [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const s = SIZE[ch];
    const d = (CELL - s) / 2;
    CELLS.push({ x: OX + c * PITCH + d, y: OY + r * PITCH + d, s, violet: ch === 'V' });
  });
});

export function BrandMark({
  size = 24,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Set when the mark stands alone; leave unset next to the word "concile". */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {/* Below 28px the quarter-tone cells are under a pixel wide and read as fuzz, not
          dither, so the small rendering drops them and keeps the silhouette crisp. */}
      {CELLS.filter((c) => size >= 28 || c.s > 3).map((c, i) => (
        <rect
          key={i}
          x={c.x.toFixed(1)}
          y={c.y.toFixed(1)}
          width={c.s}
          height={c.s}
          rx={(c.s * 0.18).toFixed(1)}
          fill={c.violet ? 'var(--brand-violet)' : 'currentColor'}
        />
      ))}
    </svg>
  );
}
