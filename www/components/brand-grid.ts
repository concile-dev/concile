// The brand bitmaps, as plain cell lists.
//
// BrandMark and BrandWordmark draw these on the page; BrandPoster draws them
// in satori for the social images. One table each, so the header, the brand
// page, the downloads in public/brand and every poster share one grid and
// cannot drift.
//
// Grid: 8-unit pitch, 7-unit cells. The mark is a pixel "c" whose open side
// dissolves into smaller dither cells, and a single violet cell arriving to
// close it. The name comes from "reconcile", and that cell is the piece that
// makes the state whole. The wordmark is the name in the same cells, with the
// dot of the i as the one violet cell.

export const PITCH = 8;
export const CELL = 7;

export type GridCell = { x: number; y: number; s: number; violet: boolean };

// ---- the mark: 8x7 cells in a 64x64 box ----

const MARK_ROWS = [
  '..XXXXh.',
  '.XXXXXhq',
  'XX....hq',
  'XX.....V',
  'XX....hq',
  '.XXXXXhq',
  '..XXXXh.',
] as const;

const MARK_OX = 0.5;
const MARK_OY = 4.5;
const MARK_SIZE: Record<string, number> = { X: CELL, V: CELL, h: 4.4, q: 2.6 };

export const MARK_BOX = 64;

export const MARK_CELLS: GridCell[] = [];
MARK_ROWS.forEach((row, r) => {
  [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const s = MARK_SIZE[ch];
    const d = (CELL - s) / 2;
    MARK_CELLS.push({ x: MARK_OX + c * PITCH + d, y: MARK_OY + r * PITCH + d, s, violet: ch === 'V' });
  });
});

// ---- the display wordmark: "concile", 7 rows tall ----

const GLYPHS: Record<string, string[]> = {
  c: ['', '', '.XXX', 'X...', 'X...', 'X...', '.XXX'],
  o: ['', '', '.XX.', 'X..X', 'X..X', 'X..X', '.XX.'],
  n: ['', '', 'XXX.', 'X..X', 'X..X', 'X..X', 'X..X'],
  i: ['V', '', 'X', 'X', 'X', 'X', 'X'],
  l: ['X', 'X', 'X', 'X', 'X', 'X', 'X'],
  e: ['', '', '.XX.', 'X..X', 'XXXX', 'X...', '.XXX'],
};

export const WORDMARK_CELLS: GridCell[] = [];
let cursor = 0;
for (const ch of 'concile') {
  const glyph = GLYPHS[ch];
  const width = Math.max(...glyph.map((row) => row.length));
  glyph.forEach((row, r) => {
    [...row].forEach((cell, c) => {
      if (cell === 'X' || cell === 'V') {
        WORDMARK_CELLS.push({ x: (cursor + c) * PITCH, y: r * PITCH, s: CELL, violet: cell === 'V' });
      }
    });
  });
  cursor += width + 1;
}
export const WORDMARK_WIDTH = (cursor - 1) * PITCH + CELL;
export const WORDMARK_HEIGHT = 6 * PITCH + CELL;
