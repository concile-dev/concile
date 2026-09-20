import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './home.css';
import { PixelBlast } from './PixelBlast';
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
  title: 'Concile — the backend to build the modern web',
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`hp ${inter.variable} ${mono.variable}`}>
      <div className="hp-veil" aria-hidden="true">
        <PixelBlast
          // Circles, not squares: the page is already all right angles, and
          // square cells on top of a hairline grid read as a second grid
          // fighting the first.
          variant="circle"
          pixelSize={4}
          // The same violet the veil and the drape work in, a shade lighter,
          // because a dot field reads darker than a wash at the same value.
          color="#a78bfa"
          patternScale={2.2}
          // Under 1: this is a backdrop, so most cells should be off. Above it
          // the field closes up into a wall of dots.
          patternDensity={0.98}
          pixelSizeJitter={0.4}
          speed={0.45}
          // Clicks land anywhere on the page, so the rings want to be slower
          // and thinner than the default to read as a ripple rather than a
          // flash.
          enableRipples
          rippleSpeed={0.34}
          rippleThickness={0.1}
          rippleIntensityScale={1.4}
          // A wide fade, so the field never runs into the edges of the viewport
          // as a hard rectangle.
          edgeFade={0.55}
        />
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
