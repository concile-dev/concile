'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Scroll-mounted islands for the landing page's visual showcases.
//
// These components carry no copy, only a mock UI or a diagram, so nothing is
// lost by leaving them out of the server-rendered HTML. What is gained: their
// JavaScript (framer-style animation, the dashboard mock, the beam diagram,
// the particle wordmark) is neither downloaded nor hydrated until the reader
// scrolls within a screen of them. Everything with text on this page stays
// server-rendered and hydrates as before.
//
// Each island reserves its height up front so mounting later moves nothing
// (CLS). The sizes are the components' natural heights at the widths the
// page is laid out for; see the notes on each.

export function LazyIsland({
  children,
  style,
  className,
  rootMargin = '600px 0px',
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, rootMargin]);
  return (
    <div ref={ref} className={className} style={style}>
      {near ? children : null}
    </div>
  );
}

const DashboardScene = dynamic(() => import('./dashboard-scene').then((m) => m.DashboardScene), { ssr: false });
const BeamDiagram = dynamic(() => import('./BeamDiagram').then((m) => m.BeamDiagram), { ssr: false });

export function DashboardIsland() {
  return (
    <LazyIsland className="island island--dashboard">
      <DashboardScene />
    </LazyIsland>
  );
}

export function BeamIsland() {
  return (
    <LazyIsland className="island island--beam">
      <BeamDiagram />
    </LazyIsland>
  );
}
