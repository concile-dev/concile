import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { BrandPoster, POSTER_SIZES } from '@/components/brand-poster';
import { posterFonts } from '@/lib/brand-fonts';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  // The brand poster with the page title on it, instead of fumadocs' generic
  // card, so a shared docs link looks like the rest of Concile.
  return new ImageResponse(
    <BrandPoster kind="docs" title={page.data.title} description={page.data.description} />,
    { ...POSTER_SIZES.docs, fonts: await posterFonts() },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
