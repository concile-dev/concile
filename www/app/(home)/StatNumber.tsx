'use client';

import { useEffect, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';

// Animated stat figure. Starts at 0 and flows to the real value the first time
// the tile scrolls into view, so the benchmark number reads as measured rather
// than decorative. Falls back to the final value when IntersectionObserver is
// unavailable or the visitor prefers reduced motion.
export function StatNumber({
  value,
  suffix,
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduced =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(value);
      return;
    }

    const el = ref.current;
    if (!el) {
      setShown(value);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(value);
          io.disconnect();
        }
      },
      { rootMargin: '-10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      <NumberFlow
        value={shown}
        format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals }}
      />
      {suffix ? <b>{suffix}</b> : null}
    </span>
  );
}
