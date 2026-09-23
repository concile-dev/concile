// The README hero: the Payload-style banner at the top of README.md.
//
// A wide card with the headline in two tones, the lockup, nine feature pills
// with inline line icons, three product cards, and a code window that runs
// off the right and bottom edges so it reads as something you are looking
// into. Same renderer as the rest of the posters (satori), same bitmaps
// (brand-grid.ts), same fonts. The export script writes it to
// .github/assets/hero.svg with the text as paths, so GitHub needs no font.
//
// The simpler wordmark card (kind "readme" in brand-poster.tsx) stays as a
// download for READMEs that want less.
//
// satori rules apply: flex only, display:flex on every box with more than one
// child, literal colours, no CSS variables.

import { MARK_BOX, MARK_CELLS } from './brand-grid';

export const README_HERO = { width: 1280, height: 400 };
const W = README_HERO.width;
const H = README_HERO.height;

const GROUND = '#0b0b0b';
const PAPER = '#ffffff';
const VIOLET = '#a78bfa';
const MUTED = 'rgba(255,255,255,0.5)';
const LINE = 'rgba(255,255,255,0.10)';

// Code colours, close to the landing hero's editor.
const KW = '#c4a7f5';
const FN = '#8ab4f8';
const STR = '#e6c07b';
const PROP = '#e8e8e8';
const PUN = 'rgba(255,255,255,0.55)';
const ID = '#ffffff';
const COMMENT = 'rgba(255,255,255,0.35)';

function Mark({ size }: { size: number }) {
  return (
    <svg viewBox={`0 0 ${MARK_BOX} ${MARK_BOX}`} width={size} height={size}>
      {MARK_CELLS.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.s} height={c.s} rx={c.s * 0.18} fill={c.violet ? VIOLET : PAPER} />
      ))}
    </svg>
  );
}

// The site's dither, fading in from the top-right corner. Deterministic.
function Dither() {
  const pitch = 18;
  const cols = Math.ceil((W * 0.6) / pitch);
  const rows = Math.ceil((H * 0.8) / pitch);
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
      const level = 1 - Math.sqrt(dx * dx + dy * dy) * 1.45;
      if (level <= bayer[r % 4][c % 4] / 16) continue;
      cells.push({ x: c * pitch, y: r * pitch, a: 0.1 + level * 0.25 });
    }
  }
  return (
    <svg viewBox={`0 0 ${cols * pitch} ${rows * pitch}`} width={cols * pitch} height={rows * pitch}>
      {cells.map((c, i) => (
        <rect key={i} x={c.x + 7.5} y={c.y + 7.5} width={3} height={3} rx={0.6} fill={`rgba(255,255,255,${c.a.toFixed(2)})`} />
      ))}
    </svg>
  );
}

type Tok = [string, string];
const CODE: Tok[][] = [
  [['import', KW], [' { ', PUN], ['query', ID], [', ', PUN], ['mutation', ID], [' } ', PUN], ['from', KW], [' ', PUN], ['"./_generated/server"', STR], [';', PUN]],
  [],
  [['export', KW], [' ', PUN], ['const', KW], [' list = ', ID], ['query', FN], ['({', PUN]],
  [['  handler', PROP], [': (', PUN], ['ctx', ID], [') =>', PUN]],
  [['    ctx', ID], ['.db.', PUN], ['query', FN], ['(', PUN], ['"messages"', STR], [').', PUN], ['collect', FN], ['(),', PUN]],
  [['});', PUN]],
  [],
  [['export', KW], [' ', PUN], ['const', KW], [' add = ', ID], ['mutation', FN], ['({', PUN]],
  [['  handler', PROP], [': (', PUN], ['ctx', ID], [', { ', PUN], ['text', ID], [' }) =>', PUN]],
  [['    ctx', ID], ['.db.', PUN], ['insert', FN], ['(', PUN], ['"messages"', STR], [', { ', PUN], ['text', ID], [' }),', PUN]],
  [['});', PUN]],
  [],
  [['// every subscriber sees the new row.', COMMENT]],
  [['// no polling, no cache to bust.', COMMENT]],
];

function CodeWindow() {
  return (
    <div style={{ position: 'absolute', left: 900, top: 112, width: 700, height: 400, display: 'flex', flexDirection: 'column', background: '#101010', border: `1px solid ${LINE}`, borderRadius: 14, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 36, padding: '0 14px', borderBottom: `1px solid ${LINE}`, background: '#141414' }}>
        {['#3a3a3a', '#3a3a3a', '#3a3a3a'].map((c, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: c, marginRight: 8 }} />)}
        <div style={{ display: 'flex', marginLeft: 12, fontFamily: 'JetBrains Mono', fontSize: 12, color: MUTED }}>concile/messages.ts</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', fontFamily: 'JetBrains Mono', fontSize: 11.5, lineHeight: 1.7 }}>
        {CODE.map((line, i) => (
          <div key={i} style={{ display: 'flex', whiteSpace: 'pre' }}>
            <div style={{ display: 'flex', width: 44, justifyContent: 'flex-end', paddingRight: 16, color: 'rgba(255,255,255,0.22)' }}>{String(i + 1)}</div>
            {line.length ? line.map((t, j) => <span key={j} style={{ color: t[1] }}>{t[0]}</span>) : <span> </span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Card({ top, label, sub }: { top: number; label: string; sub: string }) {
  return (
    <div style={{ position: 'absolute', left: 680, top, width: 270, height: 64, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 18px', background: '#161616', border: `1px solid ${LINE}`, borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>{label}</div>
      <div style={{ display: 'flex', marginTop: 3, fontFamily: 'JetBrains Mono', fontSize: 11, color: MUTED }}>{sub}</div>
    </div>
  );
}

// Pill icons: 24-unit line icons, drawn inline so the file needs nothing external.
const ICONS: Record<string, string> = {
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  wifiOff: '<line x1="2" x2="22" y1="2" y2="22"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="M16.85 11.25a10 10 0 0 1 2.22 1.68"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
};
function Icon({ name }: { name: string }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return <img width={12} height={12} src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`} style={{ marginRight: 7 }} />;
}
const PILLS: [string, string][] = [
  ['100% open source', 'code'], ['Self-hosted', 'server'], ['TypeScript first', 'braces'],
  ['Offline first', 'wifiOff'], ['Deploy anywhere', 'globe'], ['Single binary', 'box'],
  ['SQLite or Postgres', 'database'], ['Cron & workflows', 'clock'], ['Built-in dashboard', 'dashboard'],
];

export function ReadmeHero() {
  return (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: GROUND, color: PAPER, fontFamily: 'Inter', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex' }}><Dither /></div>
      <div style={{ position: 'absolute', left: 72, top: 58, display: 'flex', flexDirection: 'column', width: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 38, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.08 }}>
          <div style={{ display: 'flex' }}>Your entire backend.</div>
          <div style={{ display: 'flex', color: MUTED }}>Realtime by default.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 30 }}>
          <Mark size={30} />
          <div style={{ display: 'flex', marginLeft: 10, fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em' }}>concile</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 72, top: 246, width: 570, display: 'flex', flexWrap: 'wrap' }}>
        {PILLS.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', height: 28, padding: '0 11px 0 9px', marginRight: 8, marginBottom: 8, border: `1px solid rgba(255,255,255,0.16)`, borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 11.5, color: 'rgba(255,255,255,0.78)' }}><Icon name={p[1]} />{p[0]}</div>
        ))}
      </div>
      <Card top={150} label="Live queries" sub="reactive, no polling" />
      <Card top={226} label="Auth" sub="OAuth, passkeys, MFA" />
      <Card top={302} label="File storage" sub="S3 or local disk" />
      <CodeWindow />
    </div>
  );
}

