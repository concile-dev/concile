'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

/**
 * Architecture diagram: your code fans in to the engine, the engine fans out to
 * every subscriber. Dots flow along the wires continuously via SVG animateMotion,
 * so the whole thing runs off the main thread and needs no JS per frame.
 */

type Edge = { from: RefObject<HTMLElement | null>; to: RefObject<HTMLElement | null>; curve: number };

function useEdgePaths(
  stageRef: RefObject<HTMLElement | null>,
  edges: Edge[],
) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const s = stageRef.current;
      if (!s) return;
      const sr = s.getBoundingClientRect();
      setBox({ w: sr.width, h: sr.height });
      setPaths(
        edges.map(({ from, to, curve }) => {
          const a = from.current?.getBoundingClientRect();
          const b = to.current?.getBoundingClientRect();
          if (!a || !b) return '';
          // leave from the right edge of the source, arrive at the left edge of the target
          const sx = a.right - sr.left;
          const sy = a.top - sr.top + a.height / 2;
          const ex = b.left - sr.left;
          const ey = b.top - sr.top + b.height / 2;
          const dx = (ex - sx) * 0.5;
          // cubic with horizontal handles keeps the fan tidy at any height
          return `M ${sx},${sy} C ${sx + dx},${sy + curve} ${ex - dx},${ey - curve} ${ex},${ey}`;
        }),
      );
    };

    update();
    const ro = new ResizeObserver(update);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
    // edges are stable refs created once by the caller
  }, [stageRef, edges]);

  return { box, paths };
}

export function BeamDiagram() {
  const stageRef = useRef<HTMLDivElement>(null);
  const mutRef = useRef<HTMLDivElement>(null);
  const qryRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const webRef = useRef<HTMLDivElement>(null);
  const mobRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);

  const edges = useRef<Edge[]>([
    { from: mutRef, to: coreRef, curve: 0 },
    { from: qryRef, to: coreRef, curve: 0 },
    { from: coreRef, to: webRef, curve: 0 },
    { from: coreRef, to: mobRef, curve: 0 },
    { from: coreRef, to: dashRef, curve: 0 },
  ]).current;

  const { box, paths } = useEdgePaths(stageRef, edges);

  return (
    <div className="bd" ref={stageRef}>
      <svg className="bd-wires" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} fill="none" aria-hidden="true">
        <defs>
          {paths.map((d, i) => (
            <path id={`bd-p${i}`} d={d} key={`def-${i}`} />
          ))}
        </defs>

        {paths.map((d, i) =>
          // skip until this edge has real geometry, otherwise its dot would be
          // parked at the SVG origin
          d ? (
            <g key={i}>
              <path d={d} stroke="var(--border)" strokeWidth={1.5} />
              {/* Ambient flow: a dot riding the wire, staggered per edge.
                  It starts hidden because a circle waiting on its `begin` delay
                  renders at cx/cy (0,0) — a stray dot in the top-left corner.
                  <set> reveals it exactly when its motion starts. */}
              <circle r="3.5" fill="var(--primary)" opacity="0">
                <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${i * 0.45}s`}>
                  <mpath href={`#bd-p${i}`} />
                </animateMotion>
                <set attributeName="opacity" to="1" begin={`${i * 0.45}s`} />
              </circle>
            </g>
          ) : null,
        )}
      </svg>

      <div className="bd-col">
        <div className="bd-group">
          <span className="bd-group-l">your app</span>
          <Node innerRef={mutRef} title="add()" sub="a mutation" icon={<IconWrite />} />
          <Node innerRef={qryRef} title="list()" sub="a query" icon={<IconRead />} />
        </div>
      </div>

      <div className="bd-col bd-col--mid">
        <Node innerRef={coreRef} title="Concile" sub="reactive engine" icon={<IconCore />} core />
      </div>

      <div className="bd-col">
        <Node innerRef={webRef} title="Browser" sub="every tab" icon={<IconWeb />} />
        <Node innerRef={mobRef} title="Mobile" sub="every device" icon={<IconMobile />} />
        <Node innerRef={dashRef} title="Dashboard" sub="built in" icon={<IconDash />} />
      </div>
    </div>
  );
}

function Node({
  innerRef,
  title,
  sub,
  icon,
  core = false,
}: {
  innerRef: RefObject<HTMLDivElement | null>;
  title: string;
  sub: string;
  icon: ReactNode;
  core?: boolean;
}) {
  return (
    <div className={`bd-node${core ? ' is-core' : ''}`} ref={innerRef}>
      <span className="bd-ic">{icon}</span>
      <span className="bd-t">{title}</span>
      <span className="bd-s">{sub}</span>
    </div>
  );
}

/* --- small line icons, drawn from simple geometry --- */
const svg = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
const IconWrite = () => (
  <svg {...svg}><path d="M12 5v14M5 12h14" /></svg>
);
const IconRead = () => (
  <svg {...svg}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.5" /></svg>
);
const IconCore = () => (
  <svg {...svg}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>
);
const IconWeb = () => (
  <svg {...svg}><rect x="2.5" y="4" width="19" height="14" rx="2" /><path d="M2.5 8.5h19M8 21h8" /></svg>
);
const IconMobile = () => (
  <svg {...svg}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></svg>
);
const IconDash = () => (
  <svg {...svg}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /></svg>
);
