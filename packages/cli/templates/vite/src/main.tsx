import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConcileClient, webSocketTransport } from "@concile/client";
import { ConcileProvider } from "@concile/client/react";
import { App } from "./App";

// The @concile/vite plugin serves the backend on this page's own address. VITE_CONCILE_URL overrides it.
const url = import.meta.env.VITE_CONCILE_URL ?? `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/sync`;
const client = new ConcileClient(webSocketTransport(url));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConcileProvider client={client}>
      <App />
    </ConcileProvider>
  </StrictMode>,
);
