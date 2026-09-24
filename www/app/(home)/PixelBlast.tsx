'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LOW, demoteToLow, getQuality, isSoftwareRenderer } from './quality';

/**
 * PixelBlast, from React Bits (reactbits.dev, MIT), after the Bayer dithering
 * demo at github.com/zavalit/bayer-dithering-webgl-demo. Fragment shader
 * verbatim, ported to TypeScript.
 *
 * An fbm field is thresholded against an 8x8 Bayer matrix, so the image is a
 * grid of hard on/off cells rather than a gradient: a dither, not a blur. Each
 * lit cell is then drawn as a square, circle, triangle or diamond. Clicks push
 * a decaying ring through the field.
 *
 * TWO FEATURES ARE NOT HERE. The original's `liquid` pointer-trail distortion
 * and its `noiseAmount` grain are both post passes built on the `postprocessing`
 * package, which this project does not depend on and which exists only to serve
 * them. Everything else — the field, the four shapes, the ripples, the edge
 * fade — is in the fragment shader above and needs no composer. If the liquid
 * effect is wanted later it is one dependency and about thirty lines.
 *
 * Otherwise the wrapper follows the DarkVeil, Silk and SideRays ports in this
 * tree: built once with props read through a ref, resize watched on the parent,
 * and the loop parked off-screen, in a hidden tab and under reduced motion.
 *
 * One deliberate difference from the original: ripples are fired from a window
 * listener rather than from the canvas. This canvas is a full-page backdrop
 * behind everything with pointer-events off, so a listener on it would never
 * hear a click. On the window, clicking anywhere on the page sends a ring.
 */

const SHAPE_MAP: Record<string, number> = { square: 0, circle: 1, triangle: 2, diamond: 3 };
const MAX_CLICKS = 10;

const VERTEX_SRC = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

/**
 * Octave count is baked in rather than passed as a uniform, because a GLSL loop
 * bound has to be a constant and an early break would not save the ALU anyway.
 * Weak hardware gets a shorter loop, which means a smaller shader.
 */
const fragmentSrc = (octaves: number) => `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     ${octaves}
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;

  // sRGB gamma correction - convert linear to sRGB for accurate color output
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  fragColor = vec4(srgbColor, M);
}
`;

export interface PixelBlastProps {
  variant?: 'square' | 'circle' | 'triangle' | 'diamond';
  /** Base pixel size, scaled by DPR inside. */
  pixelSize?: number;
  color?: string;
  patternScale?: number;
  patternDensity?: number;
  pixelSizeJitter?: number;
  enableRipples?: boolean;
  rippleSpeed?: number;
  rippleThickness?: number;
  rippleIntensityScale?: number;
  /** Time scale. */
  speed?: number;
  /** 0 to 1; how far in from the edges the field fades out. */
  edgeFade?: number;
  antialias?: boolean;
}

export function PixelBlast({
  variant = 'square',
  pixelSize = 3,
  color = '#B497CF',
  patternScale = 2,
  patternDensity = 1,
  pixelSizeJitter = 0,
  enableRipples = true,
  rippleSpeed = 0.3,
  rippleThickness = 0.1,
  rippleIntensityScale = 1,
  speed = 0.5,
  edgeFade = 0.5,
  antialias = true,
}: PixelBlastProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<(() => void) | null>(null);

  const props = useRef({
    variant, pixelSize, color, patternScale, patternDensity, pixelSizeJitter,
    enableRipples, rippleSpeed, rippleThickness, rippleIntensityScale, speed, edgeFade,
  });
  props.current = {
    variant, pixelSize, color, patternScale, patternDensity, pixelSizeJitter,
    enableRipples, rippleSpeed, rippleThickness, rippleIntensityScale, speed, edgeFade,
  };

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    // This backdrop is decoration, so nothing it does may be allowed to take the
    // page with it. THREE.WebGLRenderer throws from its constructor when it
    // cannot get a context, and this runs inside a mount effect with no error
    // boundary above it, so an unguarded throw unmounts the whole landing tree
    // and the visitor gets "This page couldn't load" instead of the site.
    //
    // That is not a hypothetical. Chrome ships with WebGL blacklisted on a long
    // tail of old Intel GPUs and stale drivers, and it is off under --disable-gpu,
    // in some VMs and in locked-down enterprise builds. It also happens on a
    // remount that reuses this same <canvas>, because forceContextLoss() poisons
    // the element itself: getContext() then hands back the same lost context, on
    // which getShaderPrecisionFormat() returns null, and three dereferences it.
    //
    // Bailing out leaves the canvas transparent. The page behind it is already
    // designed to carry its own background, so the only thing lost is the field.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    // A real context exists now, so the GPU can be asked what it is. Chrome falls
    // back to SwiftShader (CPU rasterization) rather than failing outright on
    // machines with no usable driver, and that path cannot afford the full field.
    let quality = getQuality();
    // CPU rasterization cannot afford a loop at any rate. Every frame of the
    // shader runs on the main thread, so even 15fps means the page is blocked
    // for as long as it is open. Lighthouse and PageSpeed run this way (no
    // GPU), and reported 17 seconds of blocking time. On a software renderer
    // the field is drawn once and left still.
    let staticOnly = false;
    try {
      const gl = renderer.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      if (name && isSoftwareRenderer(name)) {
        demoteToLow();
        quality = LOW;
        staticOnly = true;
      }
    } catch {
      // Some browsers hide the extension for fingerprinting reasons. Not knowing
      // is fine; the adaptive throttle below still catches a slow machine.
    }

    // Publish the verdict so CSS can drop effects that are cheap to describe and
    // expensive to composite. This is the only place that knows the final tier,
    // because the GPU probe above can demote after the fact.
    document.documentElement.dataset.quality = quality.tier;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.dpr));
    renderer.setClearAlpha(0);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uClickPos: { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
      uClickTimes: { value: new Float32Array(MAX_CLICKS) },
      uShapeType: { value: SHAPE_MAP[variant] ?? 0 },
      uPixelSize: { value: pixelSize * renderer.getPixelRatio() },
      uScale: { value: patternScale },
      uDensity: { value: patternDensity },
      uPixelJitter: { value: pixelSizeJitter },
      uEnableRipples: { value: enableRipples ? 1 : 0 },
      uRippleSpeed: { value: rippleSpeed },
      uRippleThickness: { value: rippleThickness },
      uRippleIntensity: { value: rippleIntensityScale },
      uEdgeFade: { value: edgeFade },
    };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SRC,
      fragmentShader: fragmentSrc(quality.octaves),
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      glslVersion: THREE.GLSL3,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const setSize = () => {
      const w = parent.clientWidth || 1;
      const h = parent.clientHeight || 1;
      renderer.setSize(w, h, false);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      // Device pixels: the dither grid and the ripple coordinates are both in
      // them, so feeding CSS pixels here would halve the cell count on retina.
      uniforms.uResolution.value.set(canvas.width, canvas.height);
      uniforms.uPixelSize.value = props.current.pixelSize * renderer.getPixelRatio();
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(parent);
    setSize();

    // Ripples come from the window, because this canvas sits behind the page
    // with pointer-events off and would never see a click of its own.
    let clickIx = 0;
    const onPointerDown = (e: PointerEvent) => {
      if (!props.current.enableRipples) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const fx = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const fy = ((rect.height - (e.clientY - rect.top)) / rect.height) * canvas.height;
      uniforms.uClickPos.value[clickIx].set(fx, fy);
      uniforms.uClickTimes.value[clickIx] = uniforms.uTime.value;
      clickIx = (clickIx + 1) % MAX_CLICKS;
      redraw.current?.();
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clock = new THREE.Clock();
    const timeOffset = Math.random() * 1000;
    let frame = 0;
    let visible = true;

    const draw = () => {
      const p = props.current;
      uniforms.uTime.value = timeOffset + clock.getElapsedTime() * p.speed;
      uniforms.uShapeType.value = SHAPE_MAP[p.variant] ?? 0;
      uniforms.uColor.value.set(p.color);
      uniforms.uScale.value = p.patternScale;
      uniforms.uDensity.value = p.patternDensity;
      uniforms.uPixelJitter.value = p.pixelSizeJitter;
      uniforms.uEnableRipples.value = p.enableRipples ? 1 : 0;
      uniforms.uRippleSpeed.value = p.rippleSpeed;
      uniforms.uRippleThickness.value = p.rippleThickness;
      uniforms.uRippleIntensity.value = p.rippleIntensityScale;
      uniforms.uEdgeFade.value = p.edgeFade;
      renderer.render(scene, camera);
    };

    // Frame pacing.
    //
    // The field drifts at uTime * 0.05, so it is nowhere near fast enough to need
    // 60fps. Capping it is the cheapest possible win: halving the rate halves the
    // fragment work per second outright, with no change to the shader.
    let frameInterval = quality.frameInterval;
    let lastDraw = 0;

    // The cheap signals above can be wrong, and an unknown slow GPU would
    // otherwise just drop frames forever. So watch real frame times and step
    // down: full rate, then 30fps, then 15fps. Only long gaps count, and only
    // while actually drawing, so this never reacts to a backgrounded tab.
    const STEPS = [1000 / 30, 1000 / 15];
    let step = quality.tier === 'low' ? 0 : -1;
    let slow = 0;
    let sampled = 0;

    const watch = (gap: number) => {
      if (step >= STEPS.length - 1 || sampled > 240) return;
      sampled += 1;
      // 24ms is a frame and a half at 60Hz. Sustained gaps that long mean the
      // machine cannot hold the rate it is being asked for.
      if (gap > 24) slow += 1;
      else if (slow > 0) slow -= 1;
      if (slow >= 20) {
        step += 1;
        frameInterval = STEPS[step];
        slow = 0;
        sampled = 0;
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (frameInterval > 0 && now - lastDraw < frameInterval - 1) return;
      if (lastDraw > 0) watch(now - lastDraw);
      lastDraw = now;
      draw();
    };

    let drewStatic = false;
    const park = () => {
      const shouldRun = !staticOnly && visible && !document.hidden && !reduced.matches;
      if (shouldRun && !frame) {
        // Unparking is not a slow frame. Clearing this both draws immediately on
        // the next tick and keeps the gap out of the adaptive sample.
        lastDraw = 0;
        frame = requestAnimationFrame(loop);
      } else if (!shouldRun && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        // One frame so a parked canvas shows the field rather than nothing.
        draw();
      } else if (staticOnly && visible && !drewStatic) {
        // The one and only frame on a software renderer.
        drewStatic = true;
        draw();
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      park();
    });
    io.observe(canvas);

    document.addEventListener('visibilitychange', park);
    reduced.addEventListener('change', park);
    park();
    draw();
    redraw.current = draw;

    return () => {
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('visibilitychange', park);
      reduced.removeEventListener('change', park);
      redraw.current = null;
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
      // Deliberately no forceContextLoss(). It frees the context slot sooner,
      // but it does so by poisoning this <canvas> element permanently: a later
      // getContext() on it returns the same dead context rather than a new one.
      // React keeps the DOM node across a route away-and-back, so the next mount
      // would inherit the corpse and three would throw on it. dispose() has
      // already released every GPU resource we allocated, and the context itself
      // goes when the element does.
    };
    // Built once. Props are read through the ref inside draw().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [antialias]);

  useEffect(() => {
    redraw.current?.();
  }, [variant, pixelSize, color, patternScale, patternDensity, pixelSizeJitter, enableRipples, rippleSpeed, rippleThickness, rippleIntensityScale, speed, edgeFade]);

  return <canvas ref={ref} className="pixel-blast-canvas" />;
}
