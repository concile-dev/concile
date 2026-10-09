#!/usr/bin/env node
// `npm create concile [folder]` and `npm init concile` land here. Same flow as `npx concile init`.
process.argv = [process.argv[0], process.argv[1], "init", ...process.argv.slice(2)];
await import("@concile/cli/bin");
