/**
 * Wait for the rendered frame, not for the clock.
 *
 * These tests drive the real dashboard through OpenTUI's headless renderer. The
 * screen fills in two asynchronous hops: host events coalesce on a frame tick
 * before they reach React, and React then commits asynchronously. The tests used
 * to bridge both with a fixed `setTimeout`, which is really a guess about how
 * fast the machine is. The guess held on a laptop and failed on CI, where 50ms
 * and 300ms both expired before the frame was ready.
 *
 * Polling removes the guess. A slow machine takes a few more passes; a fast one
 * returns on the first. Tests also get quicker, because they stop sleeping
 * through time they do not need.
 */

export interface FrameView {
  flush: () => Promise<unknown>;
  renderOnce: () => Promise<unknown>;
  captureCharFrame: () => string;
}

export interface RenderUntilOptions {
  /**
   * Deliberately under `bun test`'s 5s default, so a genuine failure throws
   * from here with the frame attached instead of the runner killing the test
   * with a generic timeout that says nothing about what was on screen.
   */
  timeoutMs?: number;
  stepMs?: number;
  /** Named in the timeout message, so a failure says which wait gave up. */
  label?: string;
}

export async function renderUntil(
  view: FrameView,
  want: (frame: string) => boolean,
  { timeoutMs = 4_000, stepMs = 25, label = "frame" }: RenderUntilOptions = {},
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    await view.flush();
    await view.renderOnce();
    const frame = view.captureCharFrame();
    if (want(frame)) return frame;
    if (Date.now() >= deadline) {
      throw new Error(
        `renderUntil(${label}) timed out after ${timeoutMs}ms. Last frame:\n${frame}`,
      );
    }
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

/** Every one of `needles` is present in the frame. */
export const containsAll =
  (...needles: string[]) =>
  (frame: string) =>
    needles.every((n) => frame.includes(n));
