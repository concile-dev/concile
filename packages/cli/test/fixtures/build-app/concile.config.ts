import { defineScheduler } from "@concile/scheduler";

// Composes `@concile/scheduler` on purpose — exercises config-based component reconstruction
// through the real `bun build --compile` entrypoint, not just the in-process `concile dev` path.
export default { components: [defineScheduler()] };
