import type { ReactNode } from 'react';

// Passthrough wrapper. This used to do a motion `whileInView` fade-up, but
// motion's in-view detection proved unreliable in this Next + Turbopack setup
// and left whole sections stuck at opacity 0. Reliability wins: sections render
// visible, always. (The page still has plenty of motion elsewhere: the hero
// feed, the propagation comet, the live feature-grid visuals, the editor.)
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
