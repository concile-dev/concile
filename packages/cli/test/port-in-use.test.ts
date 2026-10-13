import { describe, it, expect } from "vitest";
import { createServer } from "node:net";
import { isPortFree, portInUseMessage } from "../src/port-in-use";
import { ProcessRuntimeHost } from "../src/server";

describe("port in use", () => {
  it("isPortFree sees a port someone else holds", async () => {
    const other = createServer();
    await new Promise<void>((r) => other.listen(0, "127.0.0.1", r));
    const port = (other.address() as { port: number }).port;
    expect(await isPortFree("127.0.0.1", port)).toBe(false);
    await new Promise<void>((r) => other.close(() => r()));
    expect(await isPortFree("127.0.0.1", port)).toBe(true);
  });

  it("the server rejects with a clear message instead of an unhandled error event", async () => {
    const other = createServer();
    await new Promise<void>((r) => other.listen(0, "127.0.0.1", r));
    const port = (other.address() as { port: number }).port;
    const runtime = { handler: { connect() {}, handleMessage() {}, disconnect() {} } } as never;
    await expect(new ProcessRuntimeHost().serve(runtime, { port, ip: "127.0.0.1" } as never)).rejects.toMatchObject({
      name: "PortInUseError",
      message: portInUseMessage(port),
    });
    other.close();
  });
});
