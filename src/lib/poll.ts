/** Client-side polling loop per the backend contract (2–3s interval, ~5-min cap). */

export const DEFAULT_POLL_INTERVAL_MS = 2_500;
export const DEFAULT_POLL_TIMEOUT_MS = 5 * 60 * 1_000;

export class PollTimeoutError extends Error {
  constructor(public readonly elapsedMs: number) {
    super(`Polling timed out after ${elapsedMs}ms`);
    this.name = "PollTimeoutError";
  }
}

export interface PollOptions<T> {
  intervalMs?: number;
  timeoutMs?: number;
  /** Return true when the value is terminal (stop polling, resolve with it). */
  isTerminal: (value: T) => boolean;
  /** Called after every fetch (including the terminal one) — use to update state without flicker. */
  onTick?: (value: T, elapsedMs: number) => void;
  signal?: AbortSignal;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Repeatedly calls fn until isTerminal(value) is true, the timeout elapses
 * (throws PollTimeoutError), or the signal aborts (throws DOMException AbortError).
 * Fetch errors propagate — the caller maps them (e.g. 404 -> unlinked).
 */
export async function pollUntil<T>(
  fn: () => Promise<T>,
  options: PollOptions<T>,
): Promise<T> {
  const {
    intervalMs = DEFAULT_POLL_INTERVAL_MS,
    timeoutMs = DEFAULT_POLL_TIMEOUT_MS,
    isTerminal,
    onTick,
    signal,
  } = options;
  const startedAt = Date.now();

  for (;;) {
    signal?.throwIfAborted();
    const value = await fn();
    const elapsedMs = Date.now() - startedAt;
    onTick?.(value, elapsedMs);
    if (isTerminal(value)) return value;
    if (elapsedMs >= timeoutMs) throw new PollTimeoutError(elapsedMs);
    await sleep(intervalMs);
  }
}
