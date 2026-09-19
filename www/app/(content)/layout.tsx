import type { ReactNode } from 'react';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

// Non-docs content pages (blog, pricing, comparisons...) share the marketing
// chrome with (home). Same pattern, different route group, so these pages can
// have their own structure without touching the landing page.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
