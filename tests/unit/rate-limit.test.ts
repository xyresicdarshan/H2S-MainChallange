import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

// The limiter keeps per-key state in module memory, so every test uses its own key.

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit("under-limit", { limit: 5, windowMs: 60_000 });
      expect(result.ok).toBe(true);
      expect(result.retryAfterSeconds).toBe(0);
    }
  });

  it("blocks requests over the limit with a positive retryAfterSeconds", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("over-limit", { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    }
    const blocked = rateLimit("over-limit", { limit: 3, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 2; i++) {
      expect(rateLimit("key-a", { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    }
    expect(rateLimit("key-a", { limit: 2, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit("key-b", { limit: 2, windowMs: 60_000 }).ok).toBe(true);
  });

  it("resets the window after windowMs elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T12:00:00Z"));

    for (let i = 0; i < 2; i++) {
      expect(rateLimit("window-reset", { limit: 2, windowMs: 1_000 }).ok).toBe(true);
    }
    expect(rateLimit("window-reset", { limit: 2, windowMs: 1_000 }).ok).toBe(false);

    vi.advanceTimersByTime(1_001);
    const afterReset = rateLimit("window-reset", { limit: 2, windowMs: 1_000 });
    expect(afterReset.ok).toBe(true);
    expect(afterReset.retryAfterSeconds).toBe(0);
  });
});
