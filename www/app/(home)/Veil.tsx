'use client';

// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';
import { PixelBlast } from './PixelBlast';

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
  // Theme is unknown during SSR, so the server renders dark and the client keeps
  // it until it knows better. Matches Wordmark.
  const color = resolvedTheme === 'light' ? LIGHT : DARK;

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
