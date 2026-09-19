'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Import useTheme from fumadocs, NOT from 'next-themes' directly. fumadocs
// bundles its own next-themes copy inside RootProvider; a direct import
// resolves to a second module instance whose context is empty.
import { useTheme } from 'fumadocs-ui/provider/base';

/**
 * Beams, from React Bits (reactbits.dev, MIT). Shaders, material extension and
 * geometry builder verbatim; the scene graph is imperative three instead of
 * @react-three/fiber.
 *
 * Unlike Silk this genuinely needs three. It extends THREE.ShaderLib.physical
 * by injecting into #include <begin_vertex> and #include <beginnormal_vertex>,
 * runs with lights: true, and is lit by a real directional light. That is PBR
 * with three's chunk system, not a full-screen quad, so it cannot be moved onto
 * ogl without reimplementing the lighting.
 *
 * What it does not need is @react-three/fiber or @react-three/drei.
 * @react-three/fiber augments React.JSX.IntrinsicElements globally with
 * ThreeElements, which is not scoped to the files that import it: fumadocs
 * builds defaultMdxComponents by spreading intrinsic elements, so that object
 * gains ~640 three keys and stops satisfying MDXComponents, failing typecheck
 * in components/mdx.tsx and app/docs/[[...slug]]/page.tsx. next build
 * typechecks, so it breaks the build. Verified on this branch: three on its own
 * typechecks clean, three plus r3f does not.
 *
 * Everything r3f was doing here is a dozen lines imperatively, and drei's
 * PerspectiveCamera is new THREE.PerspectiveCamera(30, aspect, ...).
 *
 * The original's DirLight configures shadow.camera bounds and a shadow bias,
 * but nothing sets castShadow and the renderer never enables shadowMap, so none
 * of it does anything. Not reproduced.
 *
 * Wrapper adds the usual: parks off-screen, in a hidden tab and under reduced
 * motion; repaints a parked canvas when a prop changes; disposes geometry,
 * material and the GL context on unmount; and sizes from the parent.
 */

const noise = `
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`;

function hexToNormalizedRGB(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.substring(0, 2), 16) / 255,
    parseInt(clean.substring(2, 4), 16) / 255,
    parseInt(clean.substring(4, 6), 16) / 255,
  ];
}

interface ExtendConfig {
  header: string;
  vertexHeader?: string;
  fragmentHeader?: string;
  vertex?: Record<string, string>;
  fragment?: Record<string, string>;
  material?: { fog?: boolean };
  uniforms?: Record<string, unknown>;
}

/** Splices custom code into three's physical shader, keeping its lighting. */
function extendMaterial(cfg: ExtendConfig): THREE.ShaderMaterial {
  const physical = THREE.ShaderLib.physical as typeof THREE.ShaderLib.physical & {
    defines?: Record<string, unknown>;
  };
  const uniforms = THREE.UniformsUtils.clone(physical.uniforms);
  const defaults = new THREE.MeshStandardMaterial(cfg.material ?? {});

  if (defaults.color) uniforms.diffuse.value = defaults.color;
  uniforms.roughness.value = defaults.roughness;
  uniforms.metalness.value = defaults.metalness;
  uniforms.envMap.value = defaults.envMap;
  uniforms.envMapIntensity.value = defaults.envMapIntensity;

  for (const [key, u] of Object.entries(cfg.uniforms ?? {})) {
    uniforms[key] =
      u !== null && typeof u === 'object' && 'value' in (u as object)
        ? (u as THREE.IUniform)
        : { value: u };
  }

  let vert = `${cfg.header}\n${cfg.vertexHeader ?? ''}\n${physical.vertexShader}`;
  let frag = `${cfg.header}\n${cfg.fragmentHeader ?? ''}\n${physical.fragmentShader}`;
  for (const [inc, code] of Object.entries(cfg.vertex ?? {})) vert = vert.replace(inc, `${inc}\n${code}`);
  for (const [inc, code] of Object.entries(cfg.fragment ?? {})) frag = frag.replace(inc, `${inc}\n${code}`);

  return new THREE.ShaderMaterial({
    defines: { ...(physical.defines ?? {}) },
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    lights: true,
    fog: !!cfg.material?.fog,
  });
}

function createStackedPlanesBufferGeometry(
  n: number,
  width: number,
  height: number,
  spacing: number,
  heightSegments: number,
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const numVertices = n * (heightSegments + 1) * 2;
  const numFaces = n * heightSegments * 2;
  const positions = new Float32Array(numVertices * 3);
  const indices = new Uint32Array(numFaces * 3);
  const uvs = new Float32Array(numVertices * 2);

  let vertexOffset = 0;
  let indexOffset = 0;
  let uvOffset = 0;
  const totalWidth = n * width + (n - 1) * spacing;
  const xOffsetBase = -totalWidth / 2;

  for (let i = 0; i < n; i++) {
    const xOffset = xOffsetBase + i * (width + spacing);
    const uvXOffset = Math.random() * 300;
    const uvYOffset = Math.random() * 300;

    for (let j = 0; j <= heightSegments; j++) {
      const y = height * (j / heightSegments - 0.5);
      positions.set([xOffset, y, 0, xOffset + width, y, 0], vertexOffset * 3);

      const uvY = j / heightSegments;
      uvs.set([uvXOffset, uvY + uvYOffset, uvXOffset + 1, uvY + uvYOffset], uvOffset);

      if (j < heightSegments) {
        const a = vertexOffset;
        const b = vertexOffset + 1;
        const c = vertexOffset + 2;
        const d = vertexOffset + 3;
        indices.set([a, b, c, c, b, d], indexOffset);
        indexOffset += 6;
      }
      vertexOffset += 2;
      uvOffset += 4;
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}

export interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  beamColor?: string;
  backgroundColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  /** Degrees. */
  rotation?: number;
  lightMode?: boolean;
}

export function Beams({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = '#ffffff',
  beamColor = '#000000',
  backgroundColor = '#000000',
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
  lightMode = false,
}: BeamsProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<(() => void) | null>(null);

  const props = useRef({ lightColor, beamColor, backgroundColor, speed, noiseIntensity, scale, rotation, lightMode });
  props.current = { lightColor, beamColor, backgroundColor, speed, noiseIntensity, scale, rotation, lightMode };

  useEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const material = extendMaterial({
      header: `
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${noise}`,
      vertexHeader: `
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }
  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }
  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,
      fragmentHeader: 'uniform float uLightMode;',
      vertex: {
        '#include <begin_vertex>': `transformed.z += getPos(transformed.xyz);`,
        '#include <beginnormal_vertex>': `objectNormal = getNormal(position.xyz);`,
      },
      fragment: {
        '#include <dithering_fragment>': `
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;
    if (uLightMode > 0.5) {
      float energy = max(max(gl_FragColor.r, gl_FragColor.g), gl_FragColor.b);
      vec3 chroma = clamp(gl_FragColor.rgb / max(energy, 0.0001), 0.0, 1.0);
      chroma = pow(chroma, vec3(1.2));
      gl_FragColor.rgb = mix(vec3(1.0), chroma, clamp(energy * 0.98, 0.0, 0.94));
    }`,
      },
      material: { fog: true },
      uniforms: {
        diffuse: new THREE.Color(...hexToNormalizedRGB(beamColor)),
        time: { value: 0 },
        roughness: 0.3,
        metalness: 0.3,
        uSpeed: { value: speed },
        envMapIntensity: 10,
        uNoiseIntensity: noiseIntensity,
        uScale: scale,
        uLightMode: lightMode ? 1 : 0,
      },
    });

    const geometry = createStackedPlanesBufferGeometry(beamNumber, beamWidth, beamHeight, 0, 100);
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));

    const dir = new THREE.DirectionalLight(new THREE.Color(lightColor), 1);
    dir.position.set(0, 3, 10);
    group.add(dir);

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 1));

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      // updateStyle false: three's setSize otherwise writes inline width/height
      // in CSS pixels and overrides the stylesheet, the same trap ogl has.
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      redraw.current?.();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let onScreen = true;
    let last = performance.now();
    const bg = new THREE.Color();

    const draw = (advance: number) => {
      const p = props.current;
      material.uniforms.time.value += 0.1 * advance;
      material.uniforms.uSpeed.value = p.speed;
      material.uniforms.uNoiseIntensity.value = p.noiseIntensity;
      material.uniforms.uScale.value = p.scale;
      material.uniforms.uLightMode.value = p.lightMode ? 1 : 0;
      (material.uniforms.diffuse.value as THREE.Color).setRGB(...hexToNormalizedRGB(p.beamColor));
      dir.color.setRGB(...hexToNormalizedRGB(p.lightColor));
      group.rotation.z = THREE.MathUtils.degToRad(p.rotation);
      (scene.background as THREE.Color).set(bg.set(p.backgroundColor));
      renderer.render(scene, camera);
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

    redraw.current = () => draw(0);
    draw(0);
    park();

    if (process.env.NODE_ENV !== 'production') {
      Object.assign(canvas, { __uniforms: material.uniforms, __redraw: redraw.current });
    }

    return () => {
      redraw.current = null;
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', park);
      reduced.removeEventListener('change', park);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
    // Structural only: everything else is pushed through props.current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beamNumber, beamWidth, beamHeight]);

  useEffect(() => {
    redraw.current?.();
  }, [lightColor, beamColor, backgroundColor, speed, noiseIntensity, scale, rotation, lightMode]);

  return <canvas ref={ref} className="beams-canvas" />;
}

/** Wires Beams to the theme and the hero's palette. */
export function HeroBeams() {
  const { resolvedTheme } = useTheme();
  const [q, setQ] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const next: Record<string, string> = {};
    for (const k of ['beam', 'light', 'bgc', 'speed', 'noise', 'scale', 'rot', 'count', 'bw', 'bh']) {
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
  const hex = (k: string, fallback: string) => (q[k] ? `#${q[k].replace('#', '')}` : fallback);

  return (
    <div className="hr-beams" aria-hidden="true">
      <Beams
        lightMode={!dark}
        // The beams are lit, not coloured: the material is near black and the
        // directional light supplies the hue, which is why lightColor carries
        // the azure and beamColor stays dark in both themes.
        beamColor={hex('beam', dark ? '#0a141d' : '#20364a')}
        lightColor={hex('light', dark ? '#6aa8dd' : '#cfe0ee')}
        // Matches --background so the canvas does not put a hard edge across
        // the hero.
        backgroundColor={hex('bgc', dark ? '#050505' : '#ffffff')}
        beamNumber={num('count', 14)}
        beamWidth={num('bw', 2)}
        beamHeight={num('bh', 18)}
        // Slower than the stock 2, same reason as the other two: this sits
        // under running copy.
        speed={num('speed', 0.9)}
        noiseIntensity={num('noise', 1.2)}
        scale={num('scale', 0.18)}
        rotation={num('rot', 28)}
      />
    </div>
  );
}
