import { describe, expect, it } from "vitest";
import { kellyFraction, recommendedStake } from "./kelly";

describe("kellyFraction", () => {
  it("returns 0 when there is no edge (fair odds == offered odds)", () => {
    // fairProbability implies fair decimal odds of exactly 2.0 -> no edge at 2.0
    expect(kellyFraction(0.5, 2.0)).toBeCloseTo(0, 10);
  });

  it("returns a positive fraction when the book's odds beat fair odds", () => {
    // fair odds = 2.0 (50%), offered 2.2 -> positive edge
    const f = kellyFraction(0.5, 2.2);
    expect(f).toBeGreaterThan(0);
    expect(f).toBeCloseTo(0.1 / 1.2, 5); // (b*p - q) / b with b=1.2, p=.5, q=.5
  });

  it("clamps negative edge to 0", () => {
    // fair odds = 2.0 (50%), offered worse than fair -> negative raw Kelly, clamp to 0
    expect(kellyFraction(0.5, 1.8)).toBe(0);
  });

  it("throws on invalid probability", () => {
    expect(() => kellyFraction(0, 2.0)).toThrow();
    expect(() => kellyFraction(1, 2.0)).toThrow();
  });

  it("throws on invalid odds", () => {
    expect(() => kellyFraction(0.5, 1)).toThrow();
  });
});

describe("recommendedStake", () => {
  it("returns 0 for non-positive bankroll", () => {
    expect(recommendedStake(0, 0.5, 2.2)).toBe(0);
    expect(recommendedStake(-100, 0.5, 2.2)).toBe(0);
  });

  it("applies the kelly multiplier to scale down full Kelly", () => {
    const full = recommendedStake(1000, 0.5, 2.2, 1);
    const quarter = recommendedStake(1000, 0.5, 2.2, 0.25);
    expect(quarter).toBeCloseTo(full * 0.25, 2);
  });

  it("defaults to quarter Kelly", () => {
    const explicit = recommendedStake(1000, 0.5, 2.2, 0.25);
    const defaulted = recommendedStake(1000, 0.5, 2.2);
    expect(defaulted).toBe(explicit);
  });

  it("returns 0 stake when there is no edge", () => {
    expect(recommendedStake(1000, 0.5, 2.0)).toBe(0);
  });
});
