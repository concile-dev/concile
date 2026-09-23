import type { MetadataRoute } from 'next';

// Served at /robots.txt. Everything is public; the only thing worth telling a
// crawler is where the sitemap lives.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://concile.dev/sitemap.xml',
  };
}
