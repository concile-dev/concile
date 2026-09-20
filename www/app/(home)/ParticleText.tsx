'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { getQuality } from './quality';
import './particle-text.css';

/**
 * ParticleText, from React Bits (reactbits.dev, MIT), ported to TypeScript.
 *
 * The text is drawn once into an offscreen canvas, that bitmap is sampled on a
 * fixed grid, and every opaque cell becomes a particle with the sample point as
 * its target. The particles start scattered, ease into place, then drift.
 *
 * Two changes from the original, both following the DarkVeil, Silk and
 * PixelBlast ports already in this tree.
 *
 * The loop parks. This sits at the very bottom of a page twelve thousand pixels
 * tall, so the original, which runs requestAnimationFrame from mount forever,
 * would animate a canvas nobody can see for as long as the tab is open. It now
 * stops when scrolled out of view, in a hidden tab, and under reduced motion
 * once the text has settled.
 *
 * Gathering replays on re-entry. Because the loop parks, the scatter would
 * otherwise play through once while off-screen and be over before it was ever
 * seen. Coming back into view restarts it.
 */

type Rgb = { r: number; g: number; b: number };

const hexToRgb = (hex: string): Rgb | null => {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
};

const mixRgb = (from: Rgb, to: Rgb, amount: number): Rgb => ({
  r: Math.round(from.r + (to.r - from.r) * amount),
  g: Math.round(from.g + (to.g - from.g) * amount),
  b: Math.round(from.b + (to.b - from.b) * amount),
});

const rgbToCss = (rgb: Rgb) => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const resolveFontSize = (
  value: number | string,
  container: HTMLElement,
  fontWeight: number | string,
  fontFamily: string,
) => {
  if (typeof value === 'number') return value;
  // A clamp() cannot be read without laying it out, so a throwaway span
  // resolves it against this container's own width.
  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  probe.style.fontSize = value;
  probe.style.fontWeight = String(fontWeight);
  probe.style.fontFamily = fontFamily;
  container.appendChild(probe);
  const size = parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
};

const waitForFonts = async (font: string) => {
  if (!('fonts' in document)) return;
  try {
    await document.fonts.load(font);
  } catch {
    // A font that will not load is not a reason to skip the text; the sample
    // falls back to whatever the browser substitutes.
  }
  await document.fonts.ready;
};

type Particle = {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  seed: number;
  depth: number;
  delay: number;
};

export type ParticleTextProps = {
  text?: string;
  /** Rendered size of each particle, in CSS pixels. */
  particleSize?: number;
  /** Sampling step over the glyph bitmap. Lower means more particles. */
  density?: number;
  color?: string;
  highlightColor?: string;
  /** How far particles start from their targets. */
  scatter?: number;
  gatherDuration?: number;
  /** Largest per-particle delay before it starts gathering. */
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  /** Resting motion once the text has formed. */
  idleDrift?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function ParticleText({
  text = 'React Bits',
  particleSize = 2,
  density = 4,
  color = '#ffffff',
  highlightColor = '#8b5cf6',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
  fontSize = 'clamp(3rem, 12vw, 8rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = true,
  className = '',
  style,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const quality = getQuality();

    let particles: Particle[] = [];
    let animationFrame: number | null = null;
    let resizeFrame: number | null = null;
    let buildId = 0;
    let gathering = false;
    let gatherStart = 0;
    let settled = false;
    let visible = false;
    let width = 0;
    let height = 0;

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = reduceQuery.matches;

    const pointer = { active: false, x: 0, y: 0, smoothX: 0, smoothY: 0 };

    const startGather = (fromScatter = true) => {
      if (!particles.length) return;
      const spread = reducedMotion ? 0 : scatter;

      for (const p of particles) {
        if (fromScatter) {
          const angle = p.seed * Math.PI * 2;
          const distance = spread * (0.35 + p.depth * 0.75);
          p.x = p.targetX + Math.cos(angle) * distance + (p.depth - 0.5) * spread * 0.55;
          p.y = p.targetY + Math.sin(angle) * distance + (p.seed - 0.5) * spread * 0.55;
        }
        p.startX = p.x;
        p.startY = p.y;
        p.delay = reducedMotion ? 0 : p.seed * stagger;
      }

      gatherStart = performance.now();
      gathering = true;
      settled = false;
    };

    const drawParticle = (p: Particle) => {
      ctx.fillStyle = p.color;
      if (p.size <= 2.1) {
        // A sub-pixel arc costs far more than a rect and looks the same.
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        return;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      // A canvas shadow is a blur per fill, thousands of times a frame. It is the
      // first thing to go when the machine cannot afford it; the mark still reads
      // without the bloom, which is why light mode already ships with it off.
      const wantGlow = glow && !reducedMotion && quality.tier === 'high';
      ctx.shadowBlur = wantGlow ? particleSize * 3 : 0;
      if (ctx.shadowBlur) ctx.shadowColor = highlightColor;

      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.18;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.18;

      let complete = true;

      for (const p of particles) {
        let baseX = p.targetX;
        let baseY = p.targetY;
        let progress = 1;

        if (gathering) {
          const span = Math.max(1, reducedMotion ? 1 : gatherDuration);
          progress = clamp((now - gatherStart - p.delay) / span, 0, 1);
          const eased = easeOutCubic(progress);
          baseX = p.startX + (p.targetX - p.startX) * eased;
          baseY = p.startY + (p.targetY - p.startY) * eased;
          if (progress < 1) complete = false;
        } else if (!reducedMotion && idleDrift > 0) {
          const t = now * 0.001;
          baseX += Math.sin(t * 0.9 + p.seed * 10) * idleDrift * p.depth;
          baseY += Math.cos(t * 0.75 + p.depth * 10) * idleDrift * p.depth;
        }

        if (pointer.active && !reducedMotion && pointerRepel > 0 && repelRadius > 0) {
          const dx = baseX - pointer.smoothX;
          const dy = baseY - pointer.smoothY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < repelRadius) {
            const force = Math.pow(1 - distance / repelRadius, 2) * pointerRepel;
            baseX += (dx / distance) * force;
            baseY += (dy / distance) * force;
          }
        }

        const follow = reducedMotion ? 1 : 0.22;
        p.x += (baseX - p.x) * follow;
        p.y += (baseY - p.y) * follow;

        ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        drawParticle(p);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (gathering && complete) gathering = false;

      // Under reduced motion there is nothing left to move once the text has
      // formed, so the loop stops rather than repainting the same frame.
      if (reducedMotion && !gathering) {
        settled = true;
        animationFrame = null;
        return;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const park = () => {
      const active = visible && !document.hidden && !settled;
      if (active && animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      } else if (!active && animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    };

    const sampleText = async () => {
      const currentBuild = ++buildId;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;

      // Every frame clears and repaints this whole buffer, so its resolution is a
      // per-frame cost and not just a memory one. Weak hardware draws at 1x.
      const dpr = Math.min(window.devicePixelRatio || 1, quality.dpr);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const computed = window.getComputedStyle(container);
      const resolvedFamily =
        fontFamily === 'inherit' ? computed.fontFamily || 'sans-serif' : fontFamily;
      let resolvedSize = resolveFontSize(fontSize, container, fontWeight, resolvedFamily);
      let font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;

      await waitForFonts(font);
      if (currentBuild !== buildId) return;

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      const content = String(text || ' ');
      // This is what stops the word running off the page. The old CSS wordmark
      // was nowrap inside an overflow:hidden box, so it was cropped mid-word at
      // any viewport narrower than the type; here it is measured and scaled
      // down until it fits.
      const maxTextWidth = width * 0.92;
      offCtx.font = font;
      let metrics = offCtx.measureText(content);
      const measuredWidth = Math.max(1, metrics.width);
      if (measuredWidth > maxTextWidth) {
        resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
        font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;
        await waitForFonts(font);
        if (currentBuild !== buildId) return;
        offCtx.font = font;
        metrics = offCtx.measureText(content);
      }

      const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
      const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || resolvedSize * 0.78);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || resolvedSize * 0.22);
      const padding = Math.max(12, Math.ceil(resolvedSize * 0.08));
      const textWidth = Math.max(1, left + right);
      const textHeight = Math.max(1, ascent + descent);

      offscreen.width = textWidth + padding * 2;
      offscreen.height = textHeight + padding * 2;
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.font = font;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(content, padding - left, padding + ascent);

      const image = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const targets: { x: number; y: number; alpha: number }[] = [];
      const step = Math.max(2, Math.floor(density));

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = image.data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: width / 2 - offscreen.width / 2 + x,
              y: height / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255,
            });
          }
        }
      }

      // Every particle here is a fill plus a shadow pass and a few trig calls per
      // frame, all on the main thread, so this budget is the whole cost of the
      // mark. At the shipped size it lands near 4,500, which measures around 4ms
      // a frame on fast hardware and scales badly downward. Weak machines get a
      // sparser field rather than a slower one.
      const budget = Math.floor(5200 * quality.particleScale);
      const floor = Math.min(900, budget);
      const maxParticles = Math.max(floor, Math.min(budget, Math.floor((width * height) / 90)));
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const baseRgb = hexToRgb(color);
      const highlightRgb = hexToRgb(highlightColor);

      particles = targets
        .filter((_, index) => index % stride === 0)
        .map((target, index) => {
          const seed = ((index * 9301 + 49297) % 233280) / 233280;
          const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;
          const blend =
            baseRgb && highlightRgb
              ? clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1)
              : 0;
          const angle = seed * Math.PI * 2;
          const distance = (reducedMotion ? 0 : scatter) * (0.35 + depth * 0.75);
          const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * scatter * 0.45;
          const startY = target.y + Math.sin(angle) * distance + (depth - 0.9) * scatter * 0.45;

          return {
            x: reducedMotion ? target.x : startX,
            y: reducedMotion ? target.y : startY,
            startX,
            startY,
            targetX: target.x,
            targetY: target.y,
            size: Math.max(0.6, particleSize * (0.75 + target.alpha * 0.45)),
            color: baseRgb && highlightRgb ? rgbToCss(mixRgb(baseRgb, highlightRgb, blend)) : color,
            seed,
            depth,
            delay: seed * stagger,
          };
        });

      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;

      if (reducedMotion) {
        for (const p of particles) {
          p.x = p.targetX;
          p.y = p.targetY;
          p.startX = p.targetX;
          p.startY = p.targetY;
          p.delay = 0;
        }
        gathering = false;
      } else {
        startGather(false);
      }

      settled = false;
      park();
    };

    const queueSample = () => {
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      // Reduced motion parks the loop once settled, so the repel needs a frame
      // scheduled or the cursor would do nothing at all.
      if (settled) {
        settled = false;
        park();
      }
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };
    const onReduceChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      sampleText();
    };

    const io = new IntersectionObserver(([entry]) => {
      const entering = entry.isIntersecting && !visible;
      visible = entry.isIntersecting;
      // The scatter is the point of this thing. Playing it out of view and
      // showing only the settled word would waste it.
      if (entering && !reducedMotion && particles.length) startGather(true);
      park();
    });

    io.observe(container);
    document.addEventListener('visibilitychange', park);
    reduceQuery.addEventListener('change', onReduceChange);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const ro = new ResizeObserver(queueSample);
    ro.observe(container);
    sampleText();

    return () => {
      buildId += 1;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', park);
      reduceQuery.removeEventListener('change', onReduceChange);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [
    text, particleSize, density, color, highlightColor, scatter, gatherDuration,
    stagger, pointerRepel, repelRadius, idleDrift, fontSize, fontWeight, fontFamily, glow,
  ]);

  return (
    <div ref={containerRef} className={`particle-text ${className}`} style={style}>
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
    </div>
  );
}
