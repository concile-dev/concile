---
"@concile/cli": patch
"@concile/vite": patch
---

`concile dev --run "<cmd>"` shows the backend and your app in separate tabs, so each one's output and URL stay apart. The app starts once the backend is up. The React + Vite starter now runs `concile dev --run vite`, and the `@concile/vite` plugin proxies to that backend instead of starting a second one. `concile init` in an existing app starts its own dev script next to the backend. Without a terminal, or with `CONCILE_TABS=0`, output stays as prefixed lines. The SQLite ExperimentalWarning no longer prints.
