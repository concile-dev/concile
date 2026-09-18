'use client';

import { useEffect, useState } from 'react';
import { MeshGradient } from '@paper-design/shaders-react';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';

/**
 * The flowing wave behind the hero.
 *
 * payloadcms.com does this with a pre-rendered MP4 (`glass-animation-5.mp4`,
 * autoplay + loop, inside a BackgroundGradient component). There is no canvas
 * and no WebGL on their page at all. Rendering offline buys them exact art
 * direction for zero runtime cost, but it also bakes in the colour, which is no
 * use to a site that has to work in light and dark from the same tokens. This
 * runs the equivalent at runtime instead, so the wave follows the theme.
 *
 * MeshGradient, not Waves. Despite the name, the Waves shader extends only
 * ShaderSizingParams, so it has no speed or frame and does not animate at all.
 * MeshGradient extends ShaderMotionParams and is the flowing one.
 *
 * Colours: the shader's parser only accepts #hex, rgb() and hsl(), and anything
 * else logs "Unsupported color format" and silently substitutes a fallback. Our
 * tokens are authored in oklch and serialise as lab(), so each one is painted
 * onto a 1x1 canvas and read back as sRGB first.
 *
 * Off-screen and background-tab parking is not handled here. ShaderMount
 * already wires its own IntersectionObserver and visibilitychange listener.
 */

// Tokens in blend order. These are the theme's only chromatic values: the
// interface around them is pure greyscale, so this shader is where all the
// colour on the page comes from. That is the same division payloadcms.com
// makes, except theirs is baked into a video and this follows the theme.
const TOKENS = ['--wave-1', '--wave-2', '--wave-3', '--wave-4'];

export function HeroWave() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<string[] | null>(null);
  const [reduced, setReduced] = useState(false);

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
      if (!ctx) return '#c67953';
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r}, ${g}, ${b})`;
    });

    probe.remove();
    setColors(next);
  }, [resolvedTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // WebGL and the resolved theme both need the client. Until they exist the
  // section's own background colour stands in, so there is no flash.
  if (!colors) return null;

  return (
    <div className="hr-wave" aria-hidden="true">
      <MeshGradient
        style={{ width: '100%', height: '100%' }}
        colors={colors}
        distortion={1}
        swirl={0.6}
        // Grain is what stops a large smooth gradient from banding on a dark
        // surface, and it is most of what reads as "glass".
        grainMixer={0.18}
        grainOverlay={0.12}
        // Slow. This sits under running text, so it has to stay far below
        // reading speed or it pulls the eye off the copy.
        speed={reduced ? 0 : 0.18}
      />
    </div>
  );
}
