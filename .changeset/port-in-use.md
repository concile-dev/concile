---
"@concile/cli": patch
---

`concile dev` and `concile serve` on a busy port print one clear line (what to stop, or which `--port` to use) instead of a Node stack trace. `concile dev --run` checks the port before opening the tabs, so the app never attaches to a server someone else left running there.
