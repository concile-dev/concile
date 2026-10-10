---
"@concile/cli": patch
---

Starters run with one command. In the React + Vite starter, `npm run dev` starts the app and the backend together through the `@concile/vite` plugin, on one address. In the Next.js starter, `npm run dev` runs `concile dev --run "next dev -p 3001"`. New `concile dev --run "<cmd>"` starts any frontend dev command next to the backend.
