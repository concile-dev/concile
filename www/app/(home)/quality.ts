'use client';

/**
 * One place that decides how much work the decorative canvases are allowed to do.
 *
 * The landing page carries two of them: a full-viewport WebGL dither field behind
 * everything, and a particle wordmark in the footer. Both were tuned on fast
 * hardware, where the backdrop costs about 0.1ms a frame. The same shader is
 * 4.6 million fragments of five-octave fbm, which is most of a frame budget on an
 * old integrated GPU, so the page needs to ask what it is running on before it
 * picks a workload.
 *
 * Only cheap, synchronous signals are used here. Probing the GPU means creating a
 * WebGL context, and a throwaway context is both wasteful and risky, so the
 * software-renderer check lives in PixelBlast where a real context already exists.
 */

export type Tier = 'high' | 'low';

export type Quality = {
  tier: Tier;
  /** Cap for devicePixelRatio. The backdrop is a dither, so 1 still reads correctly. */
  dpr: number;
  /** fbm octaves in the backdrop field. Each one costs 8 sin() per pixel. */
  octaves: number;
  /** Minimum ms between backdrop frames. 0 draws every frame. */
  frameInterval: number;
  /** Multiplier on the wordmark's particle budget. */
  particleScale: number;
};

export const HIGH: Quality = {
  tier: 'high',
  dpr: 2,
  octaves: 5,
  frameInterval: 0,
  particleScale: 1,
};

/**
 * Half the pixels, three octaves and 30fps. Against the shipped settings that is
 * roughly an eight-fold cut in fragment work per second, and the field still
 * reads the same, because it drifts at uTime * 0.05 and a dither hides the
 * missing octaves.
 */
export const LOW: Quality = {
  tier: 'low',
  dpr: 1,
  octaves: 3,
  frameInterval: 1000 / 30,
  particleScale: 0.45,
};

let cached: Quality | null = null;

/**
 * Cheap signals only, measured once per page.
 *
 * deviceMemory is Chromium-only and hardwareConcurrency is easy to spoof, so
 * neither is load-bearing on its own; they are a floor, not a verdict. Anything
 * that slips through is caught later by the adaptive throttle in PixelBlast,
 * which watches real frame times and steps down on its own.
 */
export function getQuality(): Quality {
  if (cached) return cached;
  if (typeof window === 'undefined') return HIGH;

  // Escape hatch: ?quality=low or ?quality=high.
  //
  // Without this the low path is unreachable on any machine fast enough to
  // develop on, which is the one place a silent regression could hide. Falling
  // back to the cheap field when it is broken would look like nothing at all.
  try {
    const forced = new URLSearchParams(window.location.search).get('quality');
    if (forced === 'low') return (cached = LOW);
    if (forced === 'high') return (cached = HIGH);
  } catch {
    // Malformed URL is not a reason to skip the real detection below.
  }

  const cores = navigator.hardwareConcurrency ?? 8;
  // Not in the TS DOM lib: Chromium-only, absent elsewhere.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

  cached = cores <= 4 || memory <= 4 ? LOW : HIGH;
  return cached;
}

/** Lets PixelBlast force everything down once it can see the real GPU. */
export function demoteToLow() {
  cached = LOW;
}

/** A renderer string that means there is no GPU behind this context. */
export function isSoftwareRenderer(renderer: string): boolean {
  return /swiftshader|llvmpipe|software|microsoft basic render/i.test(renderer);
}
