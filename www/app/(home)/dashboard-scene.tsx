'use client';

import { BrowserFrame } from './BrowserFrame';
import { DashboardShowcase } from './DashboardShowcase';
import { MacbookScroll } from './MacbookScroll';

// The dashboard showcase and its frame, in one module so the island's single
// dynamic import brings all of it and none of it lands in the page bundle.
export function DashboardScene() {
  return (
    <MacbookScroll>
      <BrowserFrame url="localhost:3000/_dashboard">
        <DashboardShowcase />
      </BrowserFrame>
    </MacbookScroll>
  );
}
