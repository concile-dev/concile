// The display wordmark: "concile" drawn in the mark's own cells.
//
// This is the large, stand-alone form of the name, for hero moments, the footer
// band and social cards. It is not the everyday lockup. Below about 48px the
// cells fall under two pixels and the word turns to noise before the mark
// does, so headers, favicons and READMEs use the Inter lockup instead. The
// brand page states the rule; this component just draws the word.
//
// The glyph table lives in brand-grid.ts, the same one behind
// public/brand/concile-display-wordmark*.svg and the social posters, so the
// site and the downloads cannot drift. A 7-row lowercase on the mark's 8-unit
// pitch: x-height on rows 2 to 6, ascenders from row 0, and the i-dot is the
// one violet cell, the same cell the mark uses.

import { CELL, WORDMARK_CELLS as CELLS, WORDMARK_HEIGHT as HEIGHT, WORDMARK_WIDTH as WIDTH } from './brand-grid';

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
          x={c.x}
          y={c.y}
          width={CELL}
          height={CELL}
          rx={1.3}
          fill={c.violet ? 'var(--brand-violet)' : 'currentColor'}
        />
      ))}
    </svg>
  );
}
