'use client';

import type { ReactNode } from 'react';
import type { MouseEvent } from 'react';

// Aceternity-style "Card Spotlight": an emerald glow follows the cursor across
// whichever card it is over. We track position on the grid and write CSS custom
// properties on the hovered .cell, so the server-rendered card markup stays as-is.
export function SpotlightGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  function onMove(e: MouseEvent<HTMLDivElement>) {
    const cell = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    cell.style.setProperty('--mx', `${e.clientX - r.left}px`);
    cell.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  return (
    <div className={className} onMouseMove={onMove}>
      {children}
    </div>
  );
}
