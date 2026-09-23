// Export the brand posters as files.
//
//   bun run scripts/export-brand-social.tsx
//
// Renders components/brand-poster.tsx with satori, the same renderer next/og
// uses for the live share cards, so the files under public/brand/social and
// the README header in .github/assets are pixel-for-pixel the cards the site
// serves. Run it after any change to the mark, the wordmark or the poster and
// commit the result. The README headers stay SVG: satori converts the text to
// paths, so GitHub renders them crisp with no font to load. The hero is the
// one README.md uses; the simple card is a download.

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { BrandPoster, POSTER_SIZES, type PosterKind } from '../components/brand-poster';
import { posterFonts } from '../lib/brand-fonts';

const OUT = path.join(process.cwd(), 'public', 'brand', 'social');
const README_HEADER = path.join(process.cwd(), '..', '.github', 'assets', 'hero.svg');

const FILES: { kind: PosterKind; name: string; svg?: boolean }[] = [
  { kind: 'og', name: 'concile-og-1200x630' },
  { kind: 'github', name: 'concile-github-social-1280x640' },
  { kind: 'readme', name: 'concile-readme-header-1280x400', svg: true },
  { kind: 'readmeHero', name: 'concile-readme-hero-1280x400', svg: true },
  { kind: 'linkedin', name: 'concile-linkedin-profile-banner-1584x396' },
  { kind: 'linkedinCompany', name: 'concile-linkedin-company-cover-1128x191' },
  { kind: 'avatar', name: 'concile-avatar-512' },
];

const fonts = await posterFonts();
await mkdir(OUT, { recursive: true });

for (const f of FILES) {
  const { width, height } = POSTER_SIZES[f.kind];
  const svg = await satori(<BrandPoster kind={f.kind} />, { width, height, fonts });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await writeFile(path.join(OUT, `${f.name}.png`), png);
  if (f.svg) await writeFile(path.join(OUT, `${f.name}.svg`), svg);
  console.log(`${f.name}  ${width}x${height}  ${(png.length / 1024).toFixed(0)} KB`);
  if (f.kind === 'readmeHero') {
    await writeFile(README_HEADER, svg);
    console.log(`README header -> ${path.relative(process.cwd(), README_HEADER)}`);
  }
}
