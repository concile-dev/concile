import type { MetadataRoute } from 'next';
import { blog, source } from '@/lib/source';

// Served at /sitemap.xml. Every indexable page: the static routes, each blog
// post with its publish date, and every docs page from the fumadocs source.
// /docs itself is left out because it redirects.
const SITE = 'https://concile.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const statics: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE}/brand`, changeFrequency: 'yearly', priority: 0.2 },
  ];
  const posts: MetadataRoute.Sitemap = blog.getPages().map((page) => ({
    url: `${SITE}${page.url}`,
    lastModified: new Date(page.data.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  const docs: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE}${page.url}`,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  return [...statics, ...posts, ...docs];
}
