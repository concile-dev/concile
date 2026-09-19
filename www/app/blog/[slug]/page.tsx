import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { InlineTOC } from 'fumadocs-ui/components/inline-toc';
import { blog } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';

export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();

  const Mdx = page.data.body;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog" className="text-sm text-fd-muted-foreground hover:text-fd-foreground">
        ← Back to blog
      </Link>
      <h1 className="mt-6 mb-2 text-4xl font-bold">{page.data.title}</h1>
      <p className="mb-4 text-fd-muted-foreground">{page.data.description}</p>
      <p className="mb-10 text-sm text-fd-muted-foreground">
        {page.data.author} · {new Date(page.data.date).toDateString()}
      </p>
      <InlineTOC items={page.data.toc} />
      <article className="prose mt-6">
        <Mdx components={getMDXComponents()} />
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return blog.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const params = await props.params;
  const page = blog.getPage([params.slug]);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
