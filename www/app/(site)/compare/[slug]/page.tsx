import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { compare } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';

// One comparison page per named competitor. The frontmatter carries the date
// the other product's docs and pricing were last checked; the page shows it,
// because a comparison without a date is a comparison you cannot trust.

export default async function Page(props: PageProps<'/compare/[slug]'>) {
  const params = await props.params;
  const page = compare.getPage([params.slug]);
  if (!page) notFound();

  const Mdx = page.data.body;
  const checked = new Date(page.data.checked);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.data.title,
    description: page.data.description,
    dateModified: checked.toISOString(),
    author: { '@type': 'Organization', name: 'Concile' },
    publisher: { '@type': 'Organization', name: 'Concile', url: 'https://concile.dev' },
    mainEntityOfPage: `https://concile.dev${page.url}`,
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/compare" className="text-sm text-fd-muted-foreground hover:text-fd-foreground">
        ← All comparisons
      </Link>
      <h1 className="mt-6 mb-2 text-4xl font-bold">{page.data.title}</h1>
      <p className="mb-4 text-fd-muted-foreground">{page.data.description}</p>
      <p className="mb-10 text-sm text-fd-muted-foreground">
        Checked against {page.data.competitor}&apos;s public docs and pricing on {checked.toDateString()}.
        Spotted something out of date?{' '}
        <a
          className="underline underline-offset-4"
          href="https://github.com/concile-dev/concile/issues/new"
          target="_blank"
          rel="noreferrer"
        >
          Open an issue
        </a>
        .
      </p>
      <InlineTOC items={page.data.toc} />
      <article className="prose mt-6">
        <Mdx components={getMDXComponents()} />
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return compare.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: PageProps<'/compare/[slug]'>): Promise<Metadata> {
  const params = await props.params;
  const page = compare.getPage([params.slug]);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      type: 'article',
      modifiedTime: new Date(page.data.checked).toISOString(),
      images: [{ url: '/brand/social/concile-og-1200x630.png', width: 1200, height: 630, alt: 'Concile. Your entire backend. Realtime by default.' }],
    },
  };
}
