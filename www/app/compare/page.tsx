import Link from 'next/link';
import type { Metadata } from 'next';
import { compare } from '@/lib/source';

export const metadata: Metadata = {
  title: 'Compare',
  description:
    'How Concile compares to Convex, Supabase and Firebase: hosting, the realtime model, authorization, pricing, and what it takes to move.',
};

export default function CompareIndex() {
  const pages = [...compare.getPages()].sort((a, b) => a.data.title.localeCompare(b.data.title));

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-2">Compare</h1>
      <p className="text-fd-muted-foreground mb-10 max-w-2xl">
        Side-by-side pages against the backends people weigh Concile against. Each one says where
        the other product is ahead, not only where we are, and carries the date its facts were
        checked.
      </p>
      <div className="flex flex-col divide-y divide-fd-border border-y border-fd-border">
        {pages.map((page) => (
          <Link key={page.url} href={page.url} className="group py-6">
            <h2 className="text-xl font-semibold group-hover:text-fd-primary">{page.data.title}</h2>
            <p className="text-fd-muted-foreground mt-1">{page.data.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
