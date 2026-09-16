import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Next's dev server only trusts "localhost" by default, so loading the site over
  // http://127.0.0.1 makes it reject its own /_next requests. On the HMR websocket that
  // rejection is written without a status line, which Chrome reports as
  // ERR_INVALID_HTTP_RESPONSE and which leaves the page unhydrated. Trust the loopback IP
  // too. This setting applies to the dev server only.
  allowedDevOrigins: ['127.0.0.1'],
  // This docs app is intentionally isolated from the concile backend workspace; pin Turbopack's
  // root to this directory so it doesn't infer the parent monorepo root from its lockfile.
  turbopack: {
    root: import.meta.dirname,
  },
  // The docs root has no page of its own (the old "home" duplicated
  // "What is concile?"). Send /docs to that page instead.
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/docs/get-started/what-is-concile',
        permanent: false,
      },
      // The CLI page moved from Reference into the Build group.
      {
        source: '/docs/reference/cli',
        destination: '/docs/core-concepts/cli',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
