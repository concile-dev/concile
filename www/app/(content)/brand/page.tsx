import type { Metadata } from 'next';
import { BrandMark } from '@/components/brand-mark';
import { BrandWordmark } from '@/components/brand-wordmark';

export const metadata: Metadata = {
  title: 'Brand',
  description: 'Everything you need to know about the Concile logo, wordmark, and colors, plus the files you can download.',
};

// Everything on this page is served from public/brand. The mark itself is drawn
// inline by BrandMark so the page can show it in currentColor on any tile, but
// what people download is the file, so both come from the same bitmap.

const FILES = {
  mark: [
    { label: 'SVG, for light backgrounds', href: '/brand/concile-mark.svg' },
    { label: 'SVG, for dark backgrounds', href: '/brand/concile-mark-dark.svg' },
    { label: 'SVG, one colour', href: '/brand/concile-mark-mono.svg' },
    { label: 'SVG, inherits text colour', href: '/brand/concile-mark-currentcolor.svg' },
    { label: 'PNG 512', href: '/brand/concile-mark-512.png' },
    { label: 'PNG 512, dark', href: '/brand/concile-mark-dark-512.png' },
  ],
  lockup: [
    { label: 'SVG, for light backgrounds', href: '/brand/concile-lockup.svg' },
    { label: 'SVG, for dark backgrounds', href: '/brand/concile-lockup-dark.svg' },
    { label: 'SVG, one colour', href: '/brand/concile-lockup-mono.svg' },
  ],
  display: [
    { label: 'SVG, for light backgrounds', href: '/brand/concile-display-wordmark.svg' },
    { label: 'SVG, for dark backgrounds', href: '/brand/concile-display-wordmark-dark.svg' },
    { label: 'SVG, one colour', href: '/brand/concile-display-wordmark-mono.svg' },
    { label: 'SVG, inherits text colour', href: '/brand/concile-display-wordmark-currentcolor.svg' },
  ],
};

const COLOURS = [
  { name: 'Ink', hex: '#2a2a32', note: 'Mark and wordmark on light backgrounds' },
  { name: 'Paper', hex: '#ffffff', note: 'Mark and wordmark on dark backgrounds' },
  { name: 'Violet', hex: '#6d4bd4', note: 'The reconciled cell, on light' },
  { name: 'Violet, dark', hex: '#a78bfa', note: 'The reconciled cell, on dark' },
  { name: 'Ground', hex: '#0b0b0b', note: 'Dark background' },
];

function Tile({
  dark,
  children,
  label,
}: {
  dark?: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <figure className="m-0">
      <div
        className={`flex items-center justify-center rounded-lg border border-fd-border h-52 ${
          dark ? 'bg-[#0b0b0b] text-white' : 'bg-white text-[#2a2a32]'
        }`}
      >
        {children}
      </div>
      <figcaption className="mt-2 text-sm text-fd-muted-foreground">{label}</figcaption>
    </figure>
  );
}

function Lockup({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center" style={{ gap: size * 0.32 }}>
      <BrandMark size={size} />
      <span
        className="font-bold leading-none"
        style={{ fontSize: size * 0.95, letterSpacing: '-0.03em', fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}
      >
        concile
      </span>
    </span>
  );
}

function Links({ items }: { items: { label: string; href: string }[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {items.map((f) => (
        <li key={f.href}>
          <a className="text-fd-primary underline underline-offset-4 hover:no-underline" href={f.href} download>
            {f.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function BrandPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
      <header className="mb-14">
        <h1 className="text-4xl font-bold mb-3">Brand</h1>
        <p className="text-lg text-fd-muted-foreground max-w-2xl">
          Here you'll find the Concile mark, wordmark, colors, and the simple rules for using them. Please use these exact files as they are, rather than trying to redraw them yourself.
        </p>
        <a
          className="mt-6 inline-flex items-center rounded-md bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground hover:opacity-90"
          href="/brand/concile-brand.zip"
          download
        >
          Download all files (zip)
        </a>
      </header>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">The mark</h2>
        <p className="text-fd-muted-foreground max-w-2xl">
          The name Concile comes from 'reconcile', which is exactly what our engine does: it reconciles distributed state. In modern apps, keeping the frontend and backend in perfect sync is traditionally the hardest plumbing to build. Our mark is a pixelated 'c' where the open side dissolves into smaller cells, with one violet cell arriving to close the gap. That specific cell represents the final piece of data arriving in realtime, instantly snapping into place and making the client's state perfectly whole. We built it on the exact same dot grid that powers our site's design.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Tile label="Mark on light">
            <BrandMark size={112} title="Concile" />
          </Tile>
          <Tile dark label="Mark on dark">
            <BrandMark size={112} title="Concile" />
          </Tile>
        </div>
        <Links items={FILES.mark} />
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">The lockup</h2>
        <p className="text-fd-muted-foreground max-w-2xl">
          This is the mark paired with our wordmark. The word is always lowercase, set in Inter Bold with tight tracking. The gap between the mark and the word is exactly one third of the mark's height.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Tile label="Lockup on light">
            <Lockup size={48} />
          </Tile>
          <Tile dark label="Lockup on dark">
            <Lockup size={48} />
          </Tile>
        </div>
        <Links items={FILES.lockup} />
        <p className="mt-3 text-sm text-fd-muted-foreground">
          The lockup SVGs use live text so you can still edit the wordmark if needed. Just make sure you have the Inter font installed, otherwise it will fall back to your default system font.
        </p>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">The display wordmark</h2>
        <p className="text-fd-muted-foreground max-w-2xl">
          The name drawn in the mark&apos;s own cells, with the dot of the i in violet. This is the
          large, stand-alone form for hero moments, the footer band, social cards and print. Use it
          at 48 px tall or more. Below that the cells fall under two pixels and the word turns to
          noise, so headers, favicons and READMEs use the Inter lockup above.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Tile label="Display wordmark on light, 56 px">
            <BrandWordmark height={56} />
          </Tile>
          <Tile dark label="Display wordmark on dark, 56 px">
            <BrandWordmark height={56} />
          </Tile>
        </div>
        <Links items={FILES.display} />
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">Clear space and size</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <Tile label="Keep one cell of clear space on every side, a quarter of the mark's height">
            <div className="relative">
              <div
                className="absolute rounded border border-dashed border-[#6d4bd4]/60"
                style={{ inset: -28 }}
                aria-hidden="true"
              />
              <BrandMark size={112} title="Concile with clear space" />
            </div>
          </Tile>
          <Tile label="Smallest sizes: mark 16 px, lockup 24 px tall">
            <div className="flex items-end gap-8">
              <span className="flex flex-col items-center gap-2 text-xs text-current/60">
                <BrandMark size={16} title="Concile at 16 pixels" />
                16
              </span>
              <span className="flex flex-col items-center gap-2 text-xs text-current/60">
                <BrandMark size={32} title="Concile at 32 pixels" />
                32
              </span>
              <span className="flex flex-col items-center gap-2 text-xs text-current/60">
                <Lockup size={24} />
                24
              </span>
            </div>
          </Tile>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">Colours</h2>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {COLOURS.map((c) => (
            <div key={c.hex}>
              <div
                className="h-20 rounded-lg border border-fd-border"
                style={{ background: c.hex }}
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium">{c.name}</p>
              <p className="text-sm font-mono text-fd-muted-foreground">{c.hex}</p>
              <p className="text-xs text-fd-muted-foreground mt-1">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-2xl font-semibold mb-2">Please do not</h2>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-fd-muted-foreground list-disc pl-5">
          <li>Change the violet cell to another colour, or make more cells violet.</li>
          <li>Rotate the mark, skew it, or add shadows, gradients or outlines.</li>
          <li>Put the mark inside a circle, hexagon or badge.</li>
          <li>Set the wordmark in capitals, or in a typeface other than Inter.</li>
          <li>Redraw the cells by hand. The grid is exact; use the files.</li>
          <li>Use the display wordmark below 48 px, or in place of the lockup in a header.</li>
          <li>Use the mark to imply that Concile endorses your project.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">The name</h2>
        <p className="text-fd-muted-foreground max-w-2xl">
          When you write <strong className="text-fd-foreground">Concile</strong> in a sentence, always use a capital C. The wordmark by itself is the only time it's styled in lowercase. You pronounce it just like the end of the word 'reconcile'.
        </p>
      </section>
    </main>
  );
}
