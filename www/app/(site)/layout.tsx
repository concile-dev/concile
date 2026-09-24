import { RootProvider } from 'fumadocs-ui/provider/next';
import '../global.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Script from 'next/script';

// Absolute base for the share images (opengraph-image.tsx and the docs cards).
// Without it Next resolves them against localhost and the cards never load.
export const metadata: Metadata = {
  metadataBase: new URL('https://concile.dev'),
  // Self-referencing canonical on every route. http, trailing-slash and www
  // variants already redirect, but shared links pick up query strings (utm,
  // ref) and this keeps those from being indexed as separate pages.
  alternates: { canonical: './' },
  // Every page title carries the site name, so a tab or a search result for
  // "Quickstart" says whose quickstart it is. The home page sets an absolute
  // title of its own.
  title: { template: '%s | Concile', default: 'Concile' },
  // Google Search Console ownership proof. Renders the google-site-verification
  // meta tag in <head> on every page.
  verification: { google: 'kiKhCzpdz32bLp_YjGbYMjPcRlpWIlyHkIpXq_zGP9I' },
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

// webcontainers.io sets its headings in Gilroy and its body in Inter. Gilroy is
// Radomir Tinkov's, sold through MyFonts, so self-hosting their woff2 is not
// something we can do. Outfit is the closest geometric sans with a licence that
// allows this: same near-circular bowls and tall x-height, open under SIL OFL.
// Headings only. Body text stays Inter, same split as theirs.
//
// Exposed as --font-outfit rather than --font-display. landing.css already owns
// --font-display and redefines it on .lp, so a next/font variable of that name
// is shadowed for the entire landing page and appears to do nothing.
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.className} ${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        {/* Microsoft Clarity, production only, loaded after hydration so it never
            competes with the page's own scripts. The element id must not be
            "clarity": browsers expose every id as a window global, and the loader
            reads window.clarity expecting its own queue function. With the script
            element sitting there it called an element, threw, and never loaded. */}
        {process.env.NODE_ENV === 'production' ? (
          <Script id="ms-clarity-tag" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","yng0cd0su1");`}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
