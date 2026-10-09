/** Data only. Adding a component or framework means editing this file, not the engine. */

export type ComponentId = "auth" | "authz" | "notifications" | "scheduler" | "triggers" | "workflow";
export interface ComponentSpec {
  id: ComponentId;
  pkg: string;
  label: string;
  hint: string;
  /** Named imports from `pkg`; the first is the define function used in `expr`. */
  imports: string[];
  /** The minimal valid expression placed in `components: [...]`. */
  expr: string;
  requires: ComponentId[];
  envKeys: { key: string; comment: string }[];
}

export const COMPONENTS: readonly ComponentSpec[] = [
  { id: "auth", pkg: "@concile/auth", label: "auth", hint: "sign-in and sessions", imports: ["defineAuth"], expr: "defineAuth()", requires: [], envKeys: [] },
  { id: "authz", pkg: "@concile/authz", label: "authz", hint: "roles and permissions", imports: ["defineAuthz"], expr: "defineAuthz({})", requires: ["auth"], envKeys: [] },
  {
    id: "notifications", pkg: "@concile/notifications", label: "notifications", hint: "email, SMS, push and in-app",
    imports: ["defineNotifications", "consoleEmail"],
    expr: 'defineNotifications({ channels: { email: { provider: consoleEmail(), from: "no-reply@localhost", templates: {} } } })',
    requires: [], envKeys: [],
  },
  { id: "scheduler", pkg: "@concile/scheduler", label: "scheduler", hint: "cron and delayed jobs", imports: ["defineScheduler"], expr: "defineScheduler()", requires: [], envKeys: [] },
  { id: "triggers", pkg: "@concile/triggers", label: "triggers", hint: "run code when data changes", imports: ["defineTriggers"], expr: "defineTriggers({})", requires: [], envKeys: [] },
  { id: "workflow", pkg: "@concile/workflow", label: "workflow", hint: "multi-step jobs that survive crashes", imports: ["defineWorkflow"], expr: "defineWorkflow({ workflows: {} })", requires: ["scheduler"], envKeys: [] },
];

export function componentById(id: ComponentId): ComponentSpec {
  const c = COMPONENTS.find((x) => x.id === id);
  if (!c) throw new Error(`unknown component: ${id}`);
  return c;
}

export function isComponentId(s: string): s is ComponentId {
  return COMPONENTS.some((c) => c.id === s);
}

export function withRequirements(ids: ComponentId[]): ComponentId[] {
  const want = new Set<ComponentId>();
  const add = (id: ComponentId) => { if (want.has(id)) return; want.add(id); componentById(id).requires.forEach(add); };
  ids.forEach(add);
  return COMPONENTS.map((c) => c.id).filter((id) => want.has(id));
}

export const DEFAULT_COMPONENTS: ComponentId[] = ["auth"];

export type FrameworkId = "next" | "sveltekit" | "astro" | "expo" | "vite" | "node";
export interface FrameworkSpec { id: FrameworkId; label: string; deps: string[]; envPrefix: string; snippetFile: string; snippet: string }

const REACT_SNIPPET = (envExpr: string) => `import { ConcileClient, webSocketTransport } from "@concile/client";
import { ConcileProvider } from "@concile/client/react";
const client = new ConcileClient(webSocketTransport(${envExpr}));
// wrap your app: <ConcileProvider client={client}>{children}</ConcileProvider>`;

const NEXT_SNIPPET = `"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ConcileClient, webSocketTransport } from "@concile/client";
import { ConcileProvider } from "@concile/client/react";

export function Providers({ children }: { children: ReactNode }) {
  // Browser only: server rendering and \`next build\` must not open a socket.
  const [client, setClient] = useState<ConcileClient | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_CONCILE_URL;
    if (!url) return console.error("NEXT_PUBLIC_CONCILE_URL is not set. Run \`npx concile init\`.");
    const c = new ConcileClient(webSocketTransport(url));
    setClient(c);
    return () => {
      c.close();
      setClient(null);
    };
  }, []);
  if (!client) return <p>Connecting…</p>;
  return <ConcileProvider client={client}>{children}</ConcileProvider>;
}`;

/** Detection order matters: the first match wins (Next apps can also have vite in devDeps). */
export const FRAMEWORKS: readonly FrameworkSpec[] = [
  { id: "next", label: "Next.js app", deps: ["next"], envPrefix: "NEXT_PUBLIC_", snippetFile: "app/providers.tsx", snippet: NEXT_SNIPPET },
  { id: "sveltekit", label: "SvelteKit app", deps: ["@sveltejs/kit"], envPrefix: "PUBLIC_", snippetFile: "src/lib/concile.ts", snippet: 'import { ConcileClient, webSocketTransport } from "@concile/client";\nimport { PUBLIC_CONCILE_URL } from "$env/static/public";\nexport const client = new ConcileClient(webSocketTransport(PUBLIC_CONCILE_URL));' },
  { id: "astro", label: "Astro site", deps: ["astro"], envPrefix: "PUBLIC_", snippetFile: "src/lib/concile.ts", snippet: 'import { ConcileClient, webSocketTransport } from "@concile/client";\nexport const client = new ConcileClient(webSocketTransport(import.meta.env.PUBLIC_CONCILE_URL));' },
  { id: "expo", label: "Expo app", deps: ["expo"], envPrefix: "EXPO_PUBLIC_", snippetFile: "app/_layout.tsx", snippet: REACT_SNIPPET("process.env.EXPO_PUBLIC_CONCILE_URL!") },
  { id: "vite", label: "Vite app", deps: ["vite"], envPrefix: "VITE_", snippetFile: "src/main.tsx", snippet: REACT_SNIPPET("import.meta.env.VITE_CONCILE_URL") },
  { id: "node", label: "Node project", deps: [], envPrefix: "", snippetFile: "src/concile.ts", snippet: 'import { ConcileClient, webSocketTransport } from "@concile/client";\nexport const client = new ConcileClient(webSocketTransport(process.env.CONCILE_URL!));' },
];

export type StarterId = "vite" | "next" | "none";

/**
 * Always installed. The generated code imports @concile/values, client, executor and id-codec
 * directly, and the generated concile.config.ts imports @concile/component. pnpm's strict layout
 * resolves only direct dependencies, so each must be listed.
 */
export const CORE_PACKAGES: readonly string[] = ["concile", "@concile/values", "@concile/client", "@concile/executor", "@concile/id-codec", "@concile/component"];

export const SYNC_URL = "ws://127.0.0.1:3000/api/sync";
/** Node strips TypeScript types by default from 22.18.0, and init always writes concile.config.ts. */
export const MIN_NODE = "22.18.0";

export const SAMPLE_SCHEMA = `import { defineSchema, defineTable, v } from "@concile/values";

export default defineSchema({
  messages: defineTable({
    author: v.string(),
    body: v.string(),
  }),
});
`;

export const SAMPLE_MESSAGES = `import { v } from "@concile/values";
import { query, mutation } from "./_generated/server";

// Reads data. Your app subscribes to this and gets live updates.
export const list = query({
  handler: (ctx) => ctx.db.query("messages", "by_creation").collect(),
});

// Writes data. Runs as one transaction.
export const send = mutation({
  args: { author: v.string(), body: v.string() },
  handler: (ctx, args) => ctx.db.insert("messages", args),
});
`;

export const AGENTS_BLOCK = `## Concile backend

This project uses Concile, a self-hosted reactive TypeScript backend.

- Backend functions live in \`concile/\`. Queries read, mutations write (one transaction each), actions call the outside world.
- \`concile/_generated/\` is generated. Never edit it. Run \`npx concile codegen\` (or keep \`npx concile dev\` running).
- Schema: \`concile/schema.ts\`. Components (auth, scheduler, ...): \`concile.config.ts\`. Add one with \`npx concile add <name>\`.
- Clients subscribe with \`useQuery(api.module.fn)\`; results update live, no polling.
- Docs: https://concile.dev/docs`;
