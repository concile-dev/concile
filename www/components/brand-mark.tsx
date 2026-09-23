// The Concile mark, inline.
//
// The bitmap lives in brand-grid.ts, shared with the wordmark and the social
// posters, so the header, the navbar, the brand page and the files in
// public/brand can never drift. Ink cells take currentColor, so the mark
// follows whatever text colour surrounds it. The reconciled cell is the one
// fixed colour, --brand-violet, which global.css sets per theme.

import { MARK_CELLS as CELLS } from './brand-grid';

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
