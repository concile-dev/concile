import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './home.css';
import { Veil } from './Veil';
import { GridLines } from './Grid';
import { Header } from './Header';
import { Footer } from './Footer';

// The landing.
//
// Marketing chrome of its own rather than the shared Navbar and Footer: a
// compact hairline header, a four-column footer under a giant wordmark, and
// three grid lines on the quarter points of the content column. The docs keep
// the shared shell, so the two deliberately differ.
//
// Behind all of it, PixelBlast: an fbm field thresholded against an 8x8 Bayer
// matrix, so the backdrop is a grid of hard on/off cells rather than a
// gradient. It has a texture, which suits a page whose own structure is three
// hairlines. Clicking anywhere sends a ring through it.
//
// The canvas is fixed to the viewport rather than sized to the document. One
// screen of GL covers a page twelve thousand pixels tall, and the field holds
// still while the page scrolls over it.
//
// Everything above it is translucent by a few points in home.css, which lets
// the violet through the sections instead of only between them.
//
// Follows the site light/dark toggle, shared with the docs through the single
// RootProvider in the root layout. Dark is the set this was drawn in; light is
// the same composition on white, with the backdrop dropped back and its scrim
// inverted. See the light block in home.css.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  /* Title and description carry the same words as the H1, because a visitor who
     searched one of them should land on a page that repeats it back. "Realtime"
     rather than "reactive": reactive is Convex's brand term, realtime is what
     this category is actually searched by. */
  title: 'Concile: an open-source realtime backend you host yourself',
  description:
    'Your whole backend, realtime by default. Database, live queries, auth, file storage, cron jobs and a dashboard in one binary. Open source and self-hosted.',
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`hp ${inter.variable} ${mono.variable}`}>
      <div className="hp-veil" aria-hidden="true">
        {/* Tuned per theme inside Veil rather than filtered here. See Veil.tsx. */}
        <Veil />
        <span className="hp-veil-scrim" />
      </div>
      <div className="hp-page">
        <GridLines />
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </div>
  );
}
