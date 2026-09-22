// MacBook Pro frame, adapted from the "Macbook Pro" mockup by designali-in on
// 21st.dev (https://21st.dev/@designali-in/components/macbook-pro).
//
// Two changes from the original. The hardcoded greys are CSS custom properties
// so the machine can follow the light/dark theme, and the <image> slot is gone:
// we overlay the real, interactive editor on the screen instead of painting a
// screenshot into it. MBK_SCREEN is exported so the overlay is positioned from
// the same numbers the SVG is drawn with, rather than a second set that can drift.

// The screen cutout, in viewBox units.
export const MBK_SCREEN = {
  x: 74.52,
  y: 21.32,
  w: 501.22,
  h: 323.85,
  viewW: 650,
  viewH: 400,
} as const;

export function MacbookFrame() {
  return (
    <svg
      className="mbk-svg"
      viewBox={`0 0 ${MBK_SCREEN.viewW} ${MBK_SCREEN.viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* lid: outer edge, casing, then the bezel face */}
      <path
        fill="var(--mbk-edge)"
        d="M79.56,13.18h491.32c7.23,0,13.1,5.87,13.1,13.1v336.61H66.46V26.28c0-7.23,5.87-13.1,13.1-13.1Z"
      />
      <path
        fill="var(--mbk-case)"
        d="M79.96,14.24h490.45c6.83,0,12.37,5.54,12.37,12.37v336.28H67.59V26.6c0-6.83,5.54-12.37,12.37-12.37Z"
      />
      <path
        fill="var(--mbk-bezel)"
        d="M570.25,15.74H80.34c-6.12,0-11.08,4.96-11.08,11.08v336.07h512.08V26.82c0-6.12-4.96-11.08-11.08-11.08ZM575.74,345.17H74.52V27.31c0-3.31,2.68-5.99,5.99-5.99h489.24c3.31,0,5.99,2.68,5.99,5.99v317.86Z"
      />

      {/* the screen itself. currentColor so it matches the app behind the overlay */}
      <rect
        fill="currentColor"
        x={MBK_SCREEN.x}
        y={MBK_SCREEN.y}
        width={MBK_SCREEN.w}
        height={MBK_SCREEN.h}
        rx="5"
        ry="5"
      />

      {/* hinge strip under the lid */}
      <rect fill="var(--mbk-hinge)" x="69.09" y="350.51" width="512.11" height="12.48" />

      {/* notch and camera */}
      <path
        fill="var(--mbk-notch)"
        d="M298.14,21.02h54.07v6.5c0,1.56-1.27,2.82-2.82,2.82h-48.42c-1.56,0-2.82-1.27-2.82-2.82v-6.5h0Z"
      />
      <path fill="var(--mbk-cam)" d="M325.11,25.14c-1.99.03-1.99-3.09,0-3.06,1.99-.03,1.99,3.09,0,3.06Z" />

      {/* base lip */}
      <path
        fill="var(--mbk-base)"
        d="M19.04,362.77h611.92v10.39c0,5.95-4.83,10.79-10.79,10.79H29.83c-5.95,0-10.79-4.83-10.79-10.79v-10.39h0Z"
      />

      {/* feet */}
      <polygon fill="var(--mbk-foot)" points="600.06 385.39 567.29 385.39 565.84 383.95 601.82 383.95 600.06 385.39" />
      <polygon fill="var(--mbk-foot-2)" points="598.73 386.82 568.64 386.82 567.32 385.39 600.35 385.39 598.73 386.82" />
      <polygon fill="var(--mbk-foot)" points="82.64 385.39 49.87 385.39 48.43 383.95 84.41 383.95 82.64 385.39" />
      <polygon fill="var(--mbk-foot-2)" points="81.31 386.82 51.23 386.82 49.9 385.39 82.93 385.39 81.31 386.82" />

      {/* the finger notch on the front edge */}
      <path
        fill="var(--mbk-grip)"
        d="M278.11,362.6h94.05c0,3.63-2.95,6.58-6.58,6.58h-80.89c-3.63,0-6.58-2.95-6.58-6.58h0Z"
      />
    </svg>
  );
}
