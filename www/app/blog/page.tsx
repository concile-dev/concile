import Link from 'next/link';
import type { Metadata } from 'next';
import { blog } from '@/lib/source';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'News, ideas, and deep dives from the Concile team.',
};

export default function BlogIndex() {
  const posts = [...blog.getPages()].sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  );

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-2">Blog</h1>
      <p className="text-fd-muted-foreground mb-10">
        News, ideas, and deep dives from the Concile team.
      </p>
      <div className="flex flex-col divide-y divide-fd-border border-y border-fd-border">
        {posts.map((post) => (
          <Link key={post.url} href={post.url} className="group py-6">
            <p className="text-sm text-fd-muted-foreground mb-1">
              {new Date(post.data.date).toDateString()}
            </p>
            <h2 className="text-xl font-semibold group-hover:text-fd-primary">
              {post.data.title}
            </h2>
            <p className="text-fd-muted-foreground mt-1">{post.data.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
