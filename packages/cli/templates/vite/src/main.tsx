import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConcileClient, webSocketTransport } from "@concile/client";
import { ConcileProvider } from "@concile/client/react";
import { App } from "./App";

const client = new ConcileClient(webSocketTransport(import.meta.env.VITE_CONCILE_URL));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConcileProvider client={client}>
      <App />
    </ConcileProvider>
  </StrictMode>,
);
