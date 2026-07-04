/**
 * In-memory fixed-window rate limiter.
 *
 * Serverless caveat: state lives in this instance's memory, so each warm
 * function instance counts independently and cold starts reset the window.
 * That is acceptable here — this is a brute-force speed bump, not a strict
 * global quota. A shared store (Redis/Upstash) would be needed for the latter.
 */

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

// Evict expired windows once the map grows, so long-lived instances don't leak.
const SWEEP_THRESHOLD = 1000;

function sweep(now: number): void {
  if (windows.size < SWEEP_THRESHOLD) return;
  for (const [key, state] of windows) {
    if (now >= state.resetAt) windows.delete(key);
  }
}

export function rateLimit(
  key: string,
  opts?: { limit?: number; windowMs?: number },
): RateLimitResult {
  const limit = opts?.limit ?? 10;
  const windowMs = opts?.windowMs ?? 60_000;
  const now = Date.now();

  sweep(now);

  const current = windows.get(key);
  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}
