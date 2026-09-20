'use client';

import { useEffect, useState } from 'react';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';
import { ParticleText } from './ParticleText';

// The wordmark that closes the page.
//
// It used to be a single oversized span, nowrap inside an overflow:hidden
// band, cropped by the page edge on purpose. The crop was the idea, but at any
// viewport narrower than the type it ate most of the word rather than a letter,
// so what you actually got was "concil".
//
// This samples the same word into a particle field instead. It always fits,
// because the sampler scales the glyph run to the container before it reads it,
// and it belongs to the page rather than sitting on it: the backdrop behind the
// footer is already a field of violet dots, so the mark closes in the same
// language the page opens in.
//
// Tuned per theme rather than filtered, the same way the backdrop is. White
// into violet on black; ink into violet on paper, with the bloom off, because a
// glow on white spreads into a smudge instead of reading as light.

const DARK = { color: '#ffffff', highlightColor: '#a78bfa', glow: true };
const LIGHT = { color: '#2a2a32', highlightColor: '#6d4bd4', glow: false };

export function Wordmark() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is unknown during SSR. The server renders the dark palette and the
  // client keeps it until it knows better, so the canvas is not rebuilt on a
  // guess.
  useEffect(() => setMounted(true), []);

  const tuning = mounted && resolvedTheme === 'light' ? LIGHT : DARK;

  return (
    <div className="hp-wordmark" aria-hidden="true">
      <ParticleText
        text="concile"
        // Sized to fill the band rather than to overflow it. The sampler caps
        // the run at 92% of the container width, so this is the ceiling, not
        // the final size, and narrow viewports scale down from here.
        fontSize="clamp(3.5rem, 15vw, 13rem)"
        fontWeight={700}
        // Inter, inherited from the shell. 'inherit' makes the sampler wait for
        // the real face before it reads the bitmap, which matters with a
        // next/font subset that arrives after first paint.
        fontFamily="inherit"
        // Slightly larger and sparser than the component's defaults. The
        // backdrop behind this band is already a 4px dot field, so the mark
        // needs its own grain to read as a separate thing rather than as a
        // denser patch of the same one.
        particleSize={2.4}
        density={5}
        scatter={140}
        gatherDuration={1400}
        stagger={380}
        // The mark is the last thing on the page and there is nothing to click
        // here, so the cursor gets a little more to do.
        pointerRepel={34}
        repelRadius={130}
        idleDrift={0.6}
        {...tuning}
      />
    </div>
  );
}
