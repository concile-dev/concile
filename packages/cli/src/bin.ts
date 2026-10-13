#!/usr/bin/env node
import { runCli } from "./cli";

// node:sqlite prints an ExperimentalWarning on every start. It says nothing users can act on, so
// it is dropped; every other warning still shows.
const emitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const message = typeof warning === "string" ? warning : warning.message;
  const type = typeof rest[0] === "string" ? rest[0] : (rest[0] as { type?: string } | undefined)?.type;
  if (type === "ExperimentalWarning" && message.includes("SQLite")) return;
  return (emitWarning as (...a: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;

runCli(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((e) => {
    // A busy port is the user's situation, not a crash: say what to do, without a stack trace.
    const busy = e instanceof Error && e.name === "PortInUseError";
    process.stderr.write(`${e instanceof Error ? (busy ? e.message : e.stack ?? e.message) : String(e)}\n`);
    process.exit(1);
  });
