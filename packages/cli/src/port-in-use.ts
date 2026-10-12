import { createServer } from "node:net";

/** Thrown when the HTTP server cannot listen because something else holds the port. */
export class PortInUseError extends Error {
  constructor(readonly port: number) {
    super(portInUseMessage(port));
    this.name = "PortInUseError";
  }
}

export function portInUseMessage(port: number): string {
  return `Port ${port} is already in use. Another concile server may still be running. Stop it, or pick another port with --port ${port + 100}.`;
}

/** True when nothing listens on ip:port yet. */
export function isPortFree(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, ip, () => probe.close(() => resolve(true)));
  });
}
