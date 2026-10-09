"use client";
import { useEffect, useState, type ReactNode } from "react";
import { ConcileClient, webSocketTransport } from "@concile/client";
import { ConcileProvider } from "@concile/client/react";

export function Providers({ children }: { children: ReactNode }) {
  // Create the client in the browser only. Server rendering and `next build` never open a socket.
  const [client, setClient] = useState<ConcileClient | null>(null);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_CONCILE_URL;
    if (!url) {
      console.error("NEXT_PUBLIC_CONCILE_URL is not set. Run `npx concile init`.");
      return;
    }
    const c = new ConcileClient(webSocketTransport(url));
    setClient(c);
    return () => {
      c.close();
      setClient(null);
    };
  }, []);
  if (!client) return <p>Connecting…</p>;
  return <ConcileProvider client={client}>{children}</ConcileProvider>;
}
