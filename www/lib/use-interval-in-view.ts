'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * setInterval that only runs while the element is on screen and the tab is
 * visible.
 *
 * The landing page is roughly twelve thousand pixels tall and drives several
 * small looping mocks from timers. A plain setInterval keeps firing wherever the
 * reader happens to be, so a card near the top goes on re-rendering its subtree
 * while the reader is in the FAQ, and every one of those wakeups costs a frame
 * on a machine that has none to spare. The canvases already park on an
 * IntersectionObserver; this gives the timers the same manners.
 *
 * The callback is held in a ref so that passing an inline arrow does not tear
 * the interval down and rebuild it on every render.
 */
export function useIntervalInView(
  ref: RefObject<HTMLElement | null>,
  fn: () => void,
  ms: number,
  enabled = true,
) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let id: ReturnType<typeof setInterval> | null = null;
    let visible = false;

    const sync = () => {
      const run = visible && !document.hidden;
      if (run && id === null) {
        id = setInterval(() => saved.current(), ms);
      } else if (!run && id !== null) {
        clearInterval(id);
        id = null;
      }
    };

    // No IntersectionObserver means an old engine, and the honest fallback there
    // is to run rather than to silently show a dead mock.
    if (typeof IntersectionObserver === 'undefined') {
      visible = true;
      sync();
      document.addEventListener('visibilitychange', sync);
      return () => {
        if (id !== null) clearInterval(id);
        document.removeEventListener('visibilitychange', sync);
      };
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);

    return () => {
      if (id !== null) clearInterval(id);
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [ref, ms, enabled]);
}
