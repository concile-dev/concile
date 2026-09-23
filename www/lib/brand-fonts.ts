import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Font bytes for the brand posters. satori cannot load a web font, it needs
// the raw TTF, so the three weights the posters use are vendored under
// public/brand/fonts (SIL OFL, see LICENSE.txt there). Read from disk, which
// at build time on Vercel and in the export script is the repo checkout.

const DIR = path.join(process.cwd(), 'public', 'brand', 'fonts');

export type PosterFont = { name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' };

let cached: Promise<PosterFont[]> | undefined;

export function posterFonts(): Promise<PosterFont[]> {
  cached ??= Promise.all([
    load('Inter', 'Inter-Bold.ttf', 700),
    load('Inter', 'Inter-Medium.ttf', 500),
    load('JetBrains Mono', 'JetBrainsMono-Medium.ttf', 500),
  ]);
  return cached;
}

async function load(name: string, file: string, weight: 500 | 700): Promise<PosterFont> {
  const buf = await readFile(path.join(DIR, file));
  return { name, data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), weight, style: 'normal' };
}
