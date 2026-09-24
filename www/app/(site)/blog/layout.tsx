import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

// The blog is marketing chrome, not docs chrome, so it wears the same Navbar
// and Footer as the landing page. It arrived from website/relaunch wrapped in
// fumadocs' HomeLayout, which predates those components and would have given
// the blog a different header from every other marketing page.
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
