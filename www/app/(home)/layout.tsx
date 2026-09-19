import type { ReactNode } from 'react';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

// Marketing chrome: our own Navbar/Footer rather than fumadocs' HomeLayout, so
// the same shell can be reused by other marketing route groups. Theme comes
// from the single RootProvider in the root layout, shared with the docs.
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
