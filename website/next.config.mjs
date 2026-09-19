import path from 'node:path';
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
  // Docs content lives at the repo root (../docs), outside this app dir, so Turbopack's root
  // must be the monorepo root for it to resolve those MDX modules. Set it explicitly so
  // Turbopack doesn't have to infer it from a lockfile.
  //
  // This was pinned to this directory while the docs lived in website/content/docs. Moving
  // them to the root made every generated `../../docs/*.mdx` import in .source/server.ts
  // unresolvable, because Turbopack will not resolve a module above its root. tsc has no
  // such rule, so the typecheck passed and only the running app 500'd.
  turbopack: {
    root: path.join(import.meta.dirname, '..'),
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
