'use client';

import { useEffect, useState } from 'react';
import { HalftoneDots } from '@paper-design/shaders-react';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';

/**
 * The hero backdrop, screened by Paper Shaders instead of drawn offline.
 *
 * Here for comparison against the .hr-field mask, reachable at /?bg=halftone.
 * Not the default.
 *
 * HalftoneDots does not generate a field, it screens an image: bright pixels
 * become fat dots, dark ones small. So it gets hero-field-src.webp, the same
 * sheet as a smooth gradient with no dots baked in, and does the screening
 * itself.
 *
 * The honest difference from webcontainers.io, and from the baked mask: the dot
 * grid is uniform in screen space. Their dots grow AND spread apart toward the
 * viewer, because their image is a real surface photographed in perspective.
 * This one varies dot radius on a fixed lattice, so it reads as a screened
 * photograph rather than as a receding plane. type: 'soft' buys back some of
 * the focus falloff, but not the spacing.
 *
 * Colours: the shader's parser only accepts #hex, rgb() and hsl(), and anything
 * else logs "Unsupported color format" and silently substitutes a fallback. Our
 * tokens are authored in oklch and serialise as lab(), so each one is painted
 * onto a 1x1 canvas and read back as sRGB first.
 *
 * colorBack is the page background rather than transparent. The shader paints
 * every pixel of its canvas, so a transparent back is not on offer; matching
 * --background makes the layer invisible where the dots are not.
 */
const TOKENS = ['--field-1', '--background'] as const;

export function HeroHalftone() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<[string, string] | null>(null);

  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;opacity:0;pointer-events:none';
    document.body.appendChild(probe);

    const scratch = document.createElement('canvas');
    scratch.width = 1;
    scratch.height = 1;
    const ctx = scratch.getContext('2d', { willReadFrequently: true });

    const next = TOKENS.map((token) => {
      probe.style.color = `var(${token})`;
      const css = getComputedStyle(probe).color;
      if (!ctx) return '#888888';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    }) as [string, string];

    probe.remove();
    setColors(next);
  }, [resolvedTheme]);

  // The resolved theme needs the client. Until it exists the section's own
  // background stands in, so there is no flash of the wrong colour.
  if (!colors) return null;

  const [ink, back] = colors;

  return (
    <div className="hr-field hr-field--shader" aria-hidden="true">
      <HalftoneDots
        style={{ width: '100%', height: '100%' }}
        image="/hero-field-src.webp"
        colorFront={ink}
        colorBack={back}
        type="soft"
        grid="square"
        size={0.42}
        radius={1}
        // The screen reads dark as ink, so an unmodified source puts the dense
        // dots in the empty top half and clears the sheet. hero-field-src.webp
        // is authored the way it looks (bright where the sheet is), so the
        // shader is inverted rather than the image.
        inverted
        contrast={0.55}
        // Static. The whole point of the comparison is the still image, and an
        // animated backdrop under running copy was the problem last time.
        speed={0}
        // No grain. It lands on the whole canvas including the empty top half,
        // where the mask version has literally nothing, and speckle behind the
        // headline is the opposite of what this hero wants.
        grainMixer={0}
        grainOverlay={0}
        fit="cover"
      />
    </div>
  );
}
