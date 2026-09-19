'use client';

import { useEffect, useRef, useState } from 'react';
import { Mesh, Program, Renderer, Triangle, Vec2, Vec3 } from 'ogl';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';

/**
 * Silk, from React Bits (reactbits.dev, MIT). Fragment shader verbatim, moved
 * off three/@react-three/fiber onto ogl.
 *
 * The pattern is a woven interference figure: two sine fields crossed, one
 * phase modulated by a cosine of the other, plus a hash grain. Unlike the CPPN
 * on the veil branch every number here means something, so it can be tuned on
 * purpose rather than by sweeping.
 *
 * Why not react-three-fiber, which is what the original uses. Two reasons, one
 * of them a hard blocker:
 *
 * 1. @react-three/fiber augments React.JSX.IntrinsicElements globally with
 *    ThreeElements. That is not scoped to files that import it. fumadocs builds
 *    defaultMdxComponents by spreading intrinsic elements, so with r3f present
 *    that object gains ~640 three.js keys and stops satisfying MDXComponents,
 *    which fails typecheck in components/mdx.tsx and app/docs/[[...slug]]/page.
 *    next build typechecks, so this breaks the build. The only ways out are
 *    weakening the docs typing or not having r3f in the graph.
 *
 * 2. three is 22MB installed against ogl's 708KB, for one full-screen quad that
 *    uses no scene graph, no camera, no lights and no loaders.
 *
 * The port is one line of shader. ogl's fullscreen Triangle spans uv 0..2 where
 * a PlaneGeometry spans 0..1, so the vertex halves it. Everything the fragment
 * shader sees is identical.
 *
 * The wrapper adds what the original leaves out: the loop parks off-screen, in
 * a hidden tab and under reduced motion; a parked canvas still repaints when a
 * prop changes; the GL context is released on unmount; and resize watches the
 * parent rather than the window.
 */

const vertex = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  // ogl's fullscreen Triangle carries uv across 0..2; a PlaneGeometry, which
  // this shader was written against, carries 0..1.
  vUv = uv * 0.5;
  vPosition = vec3(position, 0.0);
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `
precision highp float;

varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
uniform float uLightMode;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  float grain = rnd / 15.0 * uNoiseIntensity;
  vec3 result = uColor * pattern - vec3(grain);
if (uLightMode > 0.5) {
  float fold = smoothstep(0.28, 0.9, pattern);
  float specular = smoothstep(0.72, 0.98, pattern);
  vec3 shadowColor = uColor * 0.72;
  vec3 bodyColor = min(uColor * 1.18, vec3(1.0));
  vec3 lightBase = mix(shadowColor, bodyColor, fold);
  lightBase = mix(lightBase, vec3(1.0), specular * 0.92);
  float fineNoise = noise(gl_FragCoord.xy * 0.63 + vec2(17.0, 41.0));
  float grainSignal = (rnd + fineNoise - 1.0);
  float grainStrength = clamp(uNoiseIntensity * 0.038, 0.0, 0.16);
  result = lightBase + grainSignal * grainStrength;
}
  gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
}
`;

function hexToNormalizedRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  /** Radians. */
  rotation?: number;
  lightMode?: boolean;
}

export function Silk({
  speed = 5,
  scale = 1,
  color = '#7B7481',
  noiseIntensity = 1.5,
  rotation = 0,
  lightMode = false,
}: SilkProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<(() => void) | null>(null);

  // Pushed through a ref so a prop change does not tear down the context and
  // recompile the shader.
  const props = useRef({ speed, scale, color, noiseIntensity, rotation, lightMode });
  props.current = { speed, scale, color, noiseIntensity, rotation, lightMode };

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), canvas });
    const gl = renderer.gl;
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uScale: { value: scale },
        uNoiseIntensity: { value: noiseIntensity },
        uColor: { value: new Vec3(...hexToNormalizedRGB(color)) },
        uRotation: { value: rotation },
        uLightMode: { value: lightMode ? 1 : 0 },
        uResolution: { value: new Vec2() },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      // ogl's setSize also writes inline style.width/height in CSS pixels, which
      // overrides the stylesheet. Put the box back to full bleed.
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      redraw.current?.();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let onScreen = true;
    let last = performance.now();

    const draw = (advance: number) => {
      const p = props.current;
      // Matches the original's useFrame: uTime creeps at 0.1 per second and the
      // shader multiplies it by uSpeed.
      program.uniforms.uTime.value += 0.1 * advance;
      program.uniforms.uSpeed.value = p.speed;
      program.uniforms.uScale.value = p.scale;
      program.uniforms.uNoiseIntensity.value = p.noiseIntensity;
      program.uniforms.uColor.value.set(...hexToNormalizedRGB(p.color));
      program.uniforms.uRotation.value = p.rotation;
      program.uniforms.uLightMode.value = p.lightMode ? 1 : 0;
      renderer.render({ scene: mesh });
    };

    const loop = () => {
      const now = performance.now();
      draw((now - last) / 1000);
      last = now;
      frame = requestAnimationFrame(loop);
    };

    const park = () => {
      const run = onScreen && !document.hidden && !reduced.matches;
      if (run && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      } else if (!run && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      park();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', park);
    reduced.addEventListener('change', park);

    // Zero advance: paint the current state without moving time on.
    redraw.current = () => draw(0);
    draw(0);
    park();

    if (process.env.NODE_ENV !== 'production') {
      Object.assign(canvas, { __uniforms: program.uniforms, __redraw: redraw.current });
    }

    return () => {
      redraw.current = null;
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', park);
      reduced.removeEventListener('change', park);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Repaint on a prop change, so a parked canvas does not keep showing the
  // frame it mounted with.
  useEffect(() => {
    redraw.current?.();
  }, [speed, scale, color, noiseIntensity, rotation, lightMode]);

  return <canvas ref={ref} className="silk-canvas" />;
}

/** Wires Silk to the theme and the hero's palette. */
export function HeroSilk() {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const next: Record<string, string> = {};
    for (const k of ['color', 'speed', 'scale', 'noise', 'rot', 'silk']) {
      const v = p.get(k);
      if (v !== null) next[k] = v;
    }
    setQ(next);
  }, []);

  const dark = resolvedTheme === 'dark';
  const num = (k: string, fallback: number) => {
    const v = Number(q[k]);
    return q[k] === undefined || Number.isNaN(v) ? fallback : v;
  };

  return (
    <div
      className="hr-silk"
      aria-hidden="true"
      style={q.silk !== undefined ? ({ '--silk-opacity': q.silk } as React.CSSProperties) : undefined}
    >
      <Silk
        lightMode={!dark}
        // Taken off --wave-*: the deep stop in dark, the mid azure in light,
        // where the shader's light branch lifts its own highlights.
        color={q.color ? `#${q.color.replace('#', '')}` : dark ? '#2f5a7f' : '#9db8d0'}
        // Far slower than the stock 5. At the default this ripples fast enough
        // to pull the eye straight off the headline.
        speed={num('speed', 0.9)}
        scale={num('scale', 1.4)}
        noiseIntensity={num('noise', 1.2)}
        rotation={num('rot', 0.35)}
      />
    </div>
  );
}
