import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

// Absolute base for the share images (opengraph-image.tsx and the docs cards).
// Without it Next resolves them against localhost and the cards never load.
export const metadata: Metadata = {
  metadataBase: new URL('https://concile.dev'),
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
      </body>
    </html>
  );
}
