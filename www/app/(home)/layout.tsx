import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono, Outfit } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import './landing-base.css';
import './home.css';
import { Veil } from './Veil';
import { GridLines } from './Grid';
import { Header } from './Header';
import { Footer } from './Footer';

// The landing, as its own root layout.
//
// The rest of the site sits under app/(site) with the fumadocs shell: its
// provider, its global stylesheet (Tailwind plus the docs theme), its search
// dialog. The landing used two utilities from that sheet and none of the
// rest, but paid for all of it on every visit: ~95 KB of CSS before
// compression and the search bundle in the critical path. Two root layouts
// let the landing ship only what it draws. Same design tokens (mirrored in
// landing-base.css), same theme storage key, so the toggle here and the one
// in the docs stay in step.
//
// Marketing chrome of its own rather than the shared Navbar and Footer: a
// compact hairline header, a four-column footer under a giant wordmark, and
// three grid lines on the quarter points of the content column.
//
// Behind all of it, PixelBlast: an fbm field thresholded against an 8x8 Bayer
// matrix, so the backdrop is a grid of hard on/off cells rather than a
// gradient. It has a texture, which suits a page whose own structure is three
// hairlines. Clicking anywhere sends a ring through it. The canvas is fixed to
// the viewport rather than sized to the document, and everything above it is
// translucent by a few points in home.css, which lets the violet through the
// sections instead of only between them.
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
// Display headings below the fold (landing.css --font-display). Outfit stands
// in for Gilroy; see the note in app/(site)/layout.tsx.
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://concile.dev'),
  alternates: { canonical: './' },
  verification: { google: 'kiKhCzpdz32bLp_YjGbYMjPcRlpWIlyHkIpXq_zGP9I' },
  /* Title and description carry the same words as the H1, because a visitor who
     searched one of them should land on a page that repeats it back. "Realtime"
     rather than "reactive": reactive is Convex's brand term, realtime is what
     this category is actually searched by. */
  title: { absolute: 'Concile: an open-source realtime backend you host yourself' },
  description:
    'Your whole backend, realtime by default. Database, live queries, auth, file storage, cron jobs and a dashboard in one binary. Open source and self-hosted.',
};

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} ${inter.variable} ${mono.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body>
        {/* Same settings as fumadocs' RootProvider uses in the (site) layout, so
            the class on <html> and the "theme" key in storage mean the same
            thing on both sides. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="hp">
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
        </ThemeProvider>
        {/* Microsoft Clarity, production only, loaded after hydration. The
            element id must not be "clarity": browsers expose every id as a
            window global and the loader reads window.clarity. */}
        {process.env.NODE_ENV === 'production' ? (
          <Script id="ms-clarity-tag" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","yng0cd0su1");`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
