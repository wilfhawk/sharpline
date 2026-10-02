import { describe, expect, it } from "vitest";
import { getRateLimitDecision } from "./rate-limit-logic";

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
});