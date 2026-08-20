import { defineConfig } from "@concile/component";
import { defineAuth, consoleEmail, googleProvider, githubProvider } from "@concile/auth";
import { defineScheduler } from "@concile/scheduler";
import { defineWorkflow, workflow } from "@concile/workflow";

// `@concile/scheduler`/`@concile/workflow` are opt-in like every other component (see
// `packages/cli/src/load-config.ts` — there is no CLI-level auto-install list). They're listed
// here, alongside `auth`, as the reference pattern real projects copy from: this is what
// "default-installed" means in this config-driven architecture — every new project that starts
// from this template gets `ctx.scheduler`/`cronJobs()` and `ctx.workflow`/durable multi-step
// workflows for free, Convex-parity, out of the box. `defineWorkflow` `requires: ["scheduler"]`
// (workflow runs are dispatched through the scheduler's job queue), so it's listed after it.

// `auth`'s `email` block turns on the A2 flows (email verification, password reset, magic-link
// and OTP sign-in — `web/main.tsx` exercises all of them). `consoleEmail()` is the zero-config dev
// provider (decision 14, `components/auth/src/email/provider.ts`): it does NOT deliver anything —
// every verification/reset/magic-link code or link is printed to the `concile dev` SERVER
// console (the terminal running `bun run dev`, not the browser). Watch that terminal for the code
// to paste into the demo's UI. Swap `consoleEmail()` for `resendEmail({ apiKey, from })` (or a
// custom `{ send }` provider) to actually deliver mail in a real deployment.
// A3 (external identity): OAuth social login + third-party-JWT/OIDC verification. `googleProvider`/
// `githubProvider` need REAL credentials to reach a live provider — this demo ships with the
// env-var-driven placeholder pattern real projects copy (empty-string defaults so the config still
// RESOLVES with no `.env` set — `resolveOAuthConfig` only rejects a non-loopback http:// endpoint,
// never an empty clientId/clientSecret — but clicking a provider button with no real credentials
// set will 302 out to the provider and fail there, which is expected). Set
// GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET to actually sign in.
// `jwt.issuers` similarly ships a placeholder Clerk-shaped issuer (Clerk's example accounts domain
// is a stand-in, not a real project) — set OIDC_ISSUER/OIDC_AUDIENCE to point at a real OIDC
// issuer (Clerk/Auth0/etc.) to exercise `signInWithIdToken` for real. `web/main.tsx`'s
// third-party-token box works against ANY correctly-configured issuer, live or (for local testing
// only) a loopback mock — see `packages/cli/test/support/mock-oauth-provider.ts`.
const auth = defineAuth({
  email: {
    provider: consoleEmail(),
    from: "no-reply@demo.test",
    appName: "Auth Demo",
    baseUrl: "http://localhost:5173",
    // On so the demo's verify banner is actually reachable: signUp/signIn of an unverified
    // account return `{ needsVerification: true }` (no session), and `web/main.tsx`'s
    // VerifyBanner drives `requestEmailVerification` → `verifyEmail` to complete sign-in.
    requireEmailVerification: true,
  },
  oauth: {
    providers: {
      google: googleProvider({ clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" }),
      github: githubProvider({ clientId: process.env.GITHUB_CLIENT_ID ?? "", clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "" }),
    },
    redirectAllowlist: ["http://localhost:5173"],
  },
  jwt: { issuers: [{ issuer: process.env.OIDC_ISSUER ?? "https://example.clerk.accounts.dev", audience: process.env.OIDC_AUDIENCE ?? "concile" }] },
});

// A minimal illustrative workflow — the reference pattern real projects extend: a single
// `step.runQuery` against this project's own `whoami:get` (`concile/whoami.ts`), referenced by its
// bare string path exactly like `ctx.scheduler.runAfter`'s targets are (codegen's typed
// `internal`/`api` refs work here too). Registered under the key `"workflows:sample"` — the
// `ctx.workflow.start("workflows:sample", {})` target a real app would call from a mutation/action.
const sample = workflow.define({
  handler: async (step) => step.runQuery("whoami:get", {}),
});

export default defineConfig({
  components: [auth, defineScheduler(), defineWorkflow({ workflows: { "workflows:sample": sample } })],
});
