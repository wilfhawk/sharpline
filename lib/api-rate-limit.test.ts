import { describe, expect, it } from "vitest";
import { consumeRateLimitBucket, getRateLimitDecision } from "./rate-limit-logic";

describe("getRateLimitDecision", () => {
  it("allows requests through the configured limit", () => {
    expect(getRateLimitDecision(4, 5, 10_000)).toEqual({
      allowed: true,
      remaining: 1,
      resetAt: 10_000,
    });
  });

  it("blocks requests over the limit without negative remaining quota", () => {
    expect(getRateLimitDecision(6, 5, 10_000)).toEqual({
      allowed: false,
      remaining: 0,
      resetAt: 10_000,
    });
  });

  it("increments a local bucket and resets it after the window expires", () => {
    const first = consumeRateLimitBucket(undefined, 2, 60, 1_000);
    const second = consumeRateLimitBucket(first.bucket, 2, 60, 2_000);
    const blocked = consumeRateLimitBucket(second.bucket, 2, 60, 3_000);
    const reset = consumeRateLimitBucket(blocked.bucket, 2, 60, 61_000);

    expect(first.decision.allowed).toBe(true);
    expect(second.decision.allowed).toBe(true);
    expect(blocked.decision.allowed).toBe(false);
    expect(reset.decision.allowed).toBe(true);
    expect(reset.bucket.resetAt).toBe(121_000);
  });
});