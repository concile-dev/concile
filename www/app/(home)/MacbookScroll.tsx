'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MacbookFrame, MBK_SCREEN } from './MacbookFrame';

// The editor, sitting in a MacBook that tilts upright as you scroll to it.
//
// The whole animation is one custom property, --open, running 0 (leaned back on
// the desk) to 1 (facing you). CSS defaults it to 1, so if this effect never
// runs the section renders as an upright machine. That matters here: see
// Reveal.tsx, where motion's in-view detection left sections stuck invisible
// under Turbopack. This fails open rather than leaving the page's best section
// face-down.
//
// It reaches 1 well before the section settles, so you always interact with a
// flat, untransformed screen.

// The overlay is placed from the same numbers the SVG is drawn with, so the two
// cannot drift apart.
const screenBox = {
  left: `${(MBK_SCREEN.x / MBK_SCREEN.viewW) * 100}%`,
  top: `${(MBK_SCREEN.y / MBK_SCREEN.viewH) * 100}%`,
  width: `${(MBK_SCREEN.w / MBK_SCREEN.viewW) * 100}%`,
  height: `${(MBK_SCREEN.h / MBK_SCREEN.viewH) * 100}%`,
};

export function MacbookScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 900px)');
    let raf = 0;

    const update = () => {
      raf = 0;
      // Either of these gets the upright machine with no animation.
      if (reduced.matches || narrow.matches) {
        el.style.setProperty('--open', '1');
        return;
      }
      const top = el.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const from = vh * 0.95;
      const to = vh * 0.25;
      const p = (from - top) / (from - to);
      el.style.setProperty('--open', String(Math.min(1, Math.max(0, p))));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    reduced.addEventListener('change', update);
    narrow.addEventListener('change', update);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      reduced.removeEventListener('change', update);
      narrow.removeEventListener('change', update);
    };
  }, []);

  return (
    <div className="mbk-stage" ref={ref}>
      <div className="mbk">
        <MacbookFrame />
        <div className="mbk-screen" style={screenBox}>
          {children}
        </div>
      </div>
    </div>
  );
}
