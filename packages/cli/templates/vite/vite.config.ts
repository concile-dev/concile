import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { concile } from "@concile/vite";

// concile() starts the Concile backend with `vite` and serves it on the same address:
// the app, /api and /_dashboard all live at http://localhost:5173.
export default defineConfig({ plugins: [react(), concile()] });
