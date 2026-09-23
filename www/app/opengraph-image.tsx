import { ImageResponse } from 'next/og';
import { BrandPoster, POSTER_SIZES, TAGLINE } from '@/components/brand-poster';
import { posterFonts } from '@/lib/brand-fonts';

// The default share card: home, blog and any route without its own image.
// Docs pages carry their title on a card of their own, see app/og/docs.

export const alt = `Concile. ${TAGLINE}`;
export const size = POSTER_SIZES.og;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(<BrandPoster kind="og" />, { ...size, fonts: await posterFonts() });
}
