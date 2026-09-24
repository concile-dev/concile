'use client';

// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// PixelBlast pulls in three.js, the largest chunk on the page. It is a
// backdrop, so nothing about the first paint depends on it. Loaded after the
// browser goes idle, once the hero text is already on screen, instead of
// riding in the critical bundle ahead of hydration. Until then the page shows
// its plain ground colour, which is what the canvas fades in over anyway.
const PixelBlast = dynamic(() => import('./PixelBlast').then((m) => m.PixelBlast), { ssr: false });

// When to load the backdrop at all, and when.
//
// Not on phones: the field sits behind a column of text that covers most of
// it, and three.js is the largest download on the page. Not for people who
// asked for reduced motion or data saving. On everything else, after the
// window load event and an idle callback, so the hero, fonts and the page's
// own scripts are all done before the GPU work starts.
function useBackdropReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    if (window.innerWidth < 768) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (nav.connection?.saveData) return;

    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const arm = () => {
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setReady(true), { timeout: 4000 });
      else timer = setTimeout(() => setReady(true), 1000);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      window.removeEventListener('load', arm);
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return ready;
}

// The backdrop field, tuned per theme.
//
// Light mode used to be dark mode run through a CSS filter:
//
//   html:not(.dark) .hp-veil canvas { filter: invert(1) hue-rotate(180deg) }
//
// which is a full-screen invert and hue rotation composited over a fixed,
// viewport-sized canvas that repaints continuously. The filter pass ran on every
// one of those frames and bought nothing a colour could not.
//
// So the colour is picked per theme instead, the same way the footer wordmark
// already does it. The value below is not a new design: it is what the filter
// was producing. The shader takes uColor linear and converts to sRGB on the way
// out (1.055 * c^(1/2.4) - 0.055), so matching the old output means undoing that
// curve as well as the filter. #a78bfa paints as #d4c3fd, which inverted and
// rotated showed as #3d2d67, and feeding #0c0722 straight in paints that.
const DARK = '#a78bfa';
const LIGHT = '#0c0722';

export function Veil() {
  const { resolvedTheme } = useTheme();
  const ready = useBackdropReady();
  // Theme is unknown during SSR, so the server renders dark and the client keeps
  // it until it knows better. Matches Wordmark.
  const color = resolvedTheme === 'light' ? LIGHT : DARK;

  if (!ready) return null;
  return (
    <PixelBlast
      // Circles, not squares: the page is already all right angles, and square
      // cells on top of a hairline grid read as a second grid fighting the first.
      variant="circle"
      pixelSize={4}
      color={color}
      patternScale={2.2}
      // Under 1: this is a backdrop, so most cells should be off. Above it the
      // field closes up into a wall of dots.
      patternDensity={0.98}
      pixelSizeJitter={0.4}
      speed={0.45}
      // Clicks land anywhere on the page, so the rings want to be slower and
      // thinner than the default to read as a ripple rather than a flash.
      enableRipples
      rippleSpeed={0.34}
      rippleThickness={0.1}
      rippleIntensityScale={1.4}
      // A wide fade, so the field never runs into the edges of the viewport as a
      // hard rectangle.
      edgeFade={0.55}
    />
  );
}
