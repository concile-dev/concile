// The brand poster: one composition behind every image that leaves the site.
//
// The default Open Graph card, the docs share cards, the GitHub social
// preview, the README header, the LinkedIn banner and the org avatar all
// render from this component, so they cannot disagree with each other or
// with the mark. `kind` only changes the canvas and what fits on it.
//
// This JSX is drawn by satori (next/og on the site, the satori package in
// scripts/export-brand-social.tsx), not by a browser. Satori's rules apply:
// flex layout only, every box with more than one child says display:flex,
// no CSS variables, literal colours, and text needs a font from
// lib/brand-fonts.ts.

import { CELL, MARK_BOX, MARK_CELLS, WORDMARK_CELLS, WORDMARK_HEIGHT, WORDMARK_WIDTH } from './brand-grid';

export type PosterKind = 'og' | 'github' | 'readme' | 'linkedin' | 'linkedinCompany' | 'avatar' | 'docs';

export const POSTER_SIZES: Record<PosterKind, { width: number; height: number }> = {
  og: { width: 1200, height: 630 }, // Open Graph and Twitter cards
  github: { width: 1280, height: 640 }, // GitHub repository social preview
  readme: { width: 1280, height: 400 }, // README header, full width
  linkedin: { width: 1584, height: 396 }, // LinkedIn personal profile banner
  linkedinCompany: { width: 1128, height: 191 }, // LinkedIn company page cover
  avatar: { width: 512, height: 512 }, // GitHub org and npm avatars
  docs: { width: 1200, height: 630 }, // docs pages, title on the card
};

const GROUND = '#0b0b0b';
const PAPER = '#ffffff';
const VIOLET = '#a78bfa';
const MUTED = 'rgba(255,255,255,0.62)';
const INTER = 'Inter';
const MONO = 'JetBrains Mono';

export const TAGLINE = 'Your entire backend. Realtime by default.';
export const INSTALL = '$ npm i concile && npx concile dev';

function Mark({ size }: { size: number }) {
  return (
    <svg viewBox={`0 0 ${MARK_BOX} ${MARK_BOX}`} width={size} height={size}>
      {MARK_CELLS.map((c, i) => (
        <rect
          key={i}
          x={c.x}
          y={c.y}
          width={c.s}
          height={c.s}
          rx={c.s * 0.18}
          fill={c.violet ? VIOLET : PAPER}
        />
      ))}
    </svg>
  );
}

function Wordmark({ height }: { height: number }) {
  return (
    <svg
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      width={(WORDMARK_WIDTH / WORDMARK_HEIGHT) * height}
      height={height}
    >
      {WORDMARK_CELLS.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={CELL} height={CELL} rx={1.3} fill={c.violet ? VIOLET : PAPER} />
      ))}
    </svg>
  );
}

// The site's dither, as a corner field. Cells fade with distance from the
// top-right corner on a Bayer-ish threshold, so the grid reads as the same
// backdrop the landing page draws. Deterministic: no randomness, so every
// render of a kind is byte-identical.
function Dither({ width, height, pitch = 18 }: { width: number; height: number; pitch?: number }) {
  const cols = Math.ceil(width / pitch);
  const rows = Math.ceil(height / pitch);
  const bayer = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const cells: { x: number; y: number; a: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const dx = (cols - 1 - c) / cols;
      const dy = r / rows;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const level = 1 - dist * 1.45;
      if (level <= bayer[r % 4][c % 4] / 16) continue;
      cells.push({ x: c * pitch, y: r * pitch, a: 0.12 + level * 0.3 });
    }
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      {cells.map((c, i) => (
        <rect key={i} x={c.x + pitch / 2 - 1.5} y={c.y + pitch / 2 - 1.5} width={3} height={3} rx={0.6} fill={`rgba(255,255,255,${c.a.toFixed(2)})`} />
      ))}
    </svg>
  );
}

function Frame({
  width,
  height,
  children,
  dither = true,
}: {
  width: number;
  height: number;
  children: React.ReactNode;
  dither?: boolean;
}) {
  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        position: 'relative',
        background: GROUND,
        color: PAPER,
        fontFamily: INTER,
        overflow: 'hidden',
      }}
    >
      {dither ? (
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex' }}>
          <Dither width={Math.round(width * 0.55)} height={Math.round(height * 0.7)} />
        </div>
      ) : null}
      {children}
    </div>
  );
}

// Wide cards: wordmark, tagline, install line, stacked on the left. LinkedIn
// draws the profile photo over the bottom-left of a banner, so those two sit
// centred instead.
function Wide({ kind }: { kind: 'og' | 'github' | 'readme' | 'linkedin' | 'linkedinCompany' }) {
  const { width, height } = POSTER_SIZES[kind];
  const centred = kind === 'linkedin' || kind === 'linkedinCompany';
  const pad = Math.round(height * 0.14);
  const wordmarkH = Math.round(height * 0.24);
  // Sized by height, capped by width so the tagline never wraps on the squarer
  // 1200x630 card. Its 42 characters run about 19 units per unit of font size.
  const tagline = Math.round(Math.min(height * 0.085, width * 0.042));
  const mono = Math.round(height * 0.045);
  return (
    <Frame width={width} height={height}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: centred ? 'center' : 'flex-start',
          padding: `0 ${pad}px`,
          width,
          height,
        }}
      >
        <Wordmark height={wordmarkH} />
        <div
          style={{
            display: 'flex',
            marginTop: Math.round(height * 0.09),
            textAlign: centred ? 'center' : 'left',
            fontSize: tagline,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {TAGLINE}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: Math.round(height * 0.06),
            fontFamily: MONO,
            fontSize: mono,
            fontWeight: 500,
            color: MUTED,
          }}
        >
          {INSTALL}
        </div>
      </div>
    </Frame>
  );
}

// The docs card: small lockup, page title, description.
function Docs({ title, description }: { title: string; description?: string }) {
  const { width, height } = POSTER_SIZES.docs;
  return (
    <Frame width={width} height={height}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          width,
          height,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>
          <Mark size={40} />
          <div style={{ display: 'flex', marginLeft: 14 }}>concile</div>
          <div style={{ display: 'flex', marginLeft: 14, color: MUTED, fontWeight: 500 }}>/ docs</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 40 ? 56 : 68,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
            }}
          >
            {title}
          </div>
          {description ? (
            <div style={{ display: 'flex', marginTop: 22, fontSize: 30, fontWeight: 500, color: MUTED, lineHeight: 1.35 }}>
              {description}
            </div>
          ) : null}
        </div>
      </div>
    </Frame>
  );
}

// The avatar: the mark on a tile. Same padding rule as the favicon.
function Avatar() {
  const { width, height } = POSTER_SIZES.avatar;
  return (
    <Frame width={width} height={height} dither={false}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width, height }}>
        <Mark size={Math.round(width * 0.66)} />
      </div>
    </Frame>
  );
}

export function BrandPoster({
  kind,
  title,
  description,
}: {
  kind: PosterKind;
  /** docs only */
  title?: string;
  description?: string;
}) {
  if (kind === 'avatar') return <Avatar />;
  if (kind === 'docs') return <Docs title={title ?? 'Documentation'} description={description} />;
  return <Wide kind={kind} />;
}
