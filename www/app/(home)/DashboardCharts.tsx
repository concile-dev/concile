'use client';

import { useId, useState } from 'react';

// Charts for the dashboard's Analytics pane.
//
// One series per chart on purpose: Copper is a single hue, so two series would
// have to be told apart by two neighbouring shades of the same colour. Series
// colour is set by --db-series, which is a chart-only token. It is not the brand
// --primary: that one measures 2.93:1 on the light surface and sits at lightness
// 0.75 in dark, outside the 0.48-0.67 band. These steps were validated against
// both surfaces instead of picked by eye.

const W = 640;

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

// --- area chart: change over time ------------------------------------------
export function AreaChart({
  points,
  label,
  unit,
  height = 132,
}: {
  points: number[];
  label: string;
  unit: string;
  height?: number;
}) {
  const gid = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(...points) * 1.15;
  const min = 0;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => height - ((v - min) / (max - min)) * height;

  const line = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${W},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  const active = hover ?? points.length - 1;

  return (
    <figure className="ch">
      <figcaption className="ch-cap">
        <span>{label}</span>
        {/* the series colour warns below 3:1 relief on some surfaces, so the
            current value is always spelled out, never colour-only */}
        <b className="ch-now">
          {fmt(last)} <span>{unit}</span>
        </b>
      </figcaption>

      <div className="ch-plot">
        <svg
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          className="ch-svg"
          role="img"
          aria-label={`${label}: ${fmt(last)} ${unit}`}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
            setHover(Math.min(points.length - 1, Math.max(0, i)));
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--db-series)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--db-series)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* recessive grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={height * f} y2={height * f} className="ch-grid" vectorEffect="non-scaling-stroke" />
          ))}

          <path d={area} fill={`url(#g${gid})`} />
          <path d={line} className="ch-line" fill="none" vectorEffect="non-scaling-stroke" />

          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1="0" y2={height} className="ch-cross" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {/* dot and tooltip live in HTML so they keep their shape while the svg stretches */}
        <span className="ch-dot" style={{ left: `${(active / (points.length - 1)) * 100}%`, top: `${(y(points[active]) / height) * 100}%` }} />
        {hover !== null && (
          <span className="ch-tip" style={{ left: `${(hover / (points.length - 1)) * 100}%` }}>
            {fmt(points[hover])} {unit}
          </span>
        )}
      </div>
    </figure>
  );
}

// --- bars: magnitude by bucket ---------------------------------------------
export function BarChart({
  bars,
  label,
  unit,
  height = 104,
}: {
  bars: { k: string; v: number }[];
  label: string;
  unit: string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...bars.map((b) => b.v)) * 1.2;

  return (
    <figure className="ch">
      <figcaption className="ch-cap">
        <span>{label}</span>
        <b className="ch-now">
          {hover === null ? fmt(bars[bars.length - 1].v) : fmt(bars[hover].v)} <span>{unit}</span>
        </b>
      </figcaption>

      <div className="ch-bars" style={{ height }}>
        {bars.map((b, i) => (
          <span
            key={b.k}
            className={i === hover ? 'ch-bar is-on' : 'ch-bar'}
            style={{ height: `${(b.v / max) * 100}%` }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            title={`${b.k}: ${fmt(b.v)} ${unit}`}
          />
        ))}
      </div>
      <div className="ch-axis">
        <span>{bars[0].k}</span>
        <span>{bars[bars.length - 1].k}</span>
      </div>
    </figure>
  );
}
