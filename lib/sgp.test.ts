import { describe, expect, it } from "vitest";
import { computeParlayOdds, computeSgpEv } from "./sgp";

describe("computeParlayOdds", () => {
  it("multiplies decimal odds across all legs", () => {
    expect(computeParlayOdds([{ oddsDecimal: 1.9 }, { oddsDecimal: 2.1 }])).toBeCloseTo(3.99, 6);
  });

  it("returns 1 for an empty leg list", () => {
    expect(computeParlayOdds([])).toBe(1);
  });
});

describe("computeSgpEv", () => {
  const legA = { id: "a", label: "Leg A", oddsDecimal: 1.9, fairProbability: 0.52 };
  const legB = { id: "b", label: "Leg B", oddsDecimal: 2.1, fairProbability: 0.48 };

  it("throws for an empty leg list", () => {
    expect(() => computeSgpEv([], 1, 4)).toThrow();
  });

  it("throws for a non-positive correlation factor", () => {
    expect(() => computeSgpEv([legA, legB], 0, 4)).toThrow();
  });

  it("uses the plain independence product when correlationFactor is 1", () => {
    const result = computeSgpEv([legA, legB], 1, 3.5);
    expect(result.adjustedFairProbability).toBeCloseTo(0.52 * 0.48, 6);
    expect(result.independenceFairProbability).toBeCloseTo(0.52 * 0.48, 6);
  });

  it("scales up the fair probability with correlationFactor > 1, clamped at the least-likely leg", () => {
    const result = computeSgpEv([legA, legB], 10, 3.5);
    // 0.52*0.48*10 = 2.496, way above 1 -> must clamp to min(0.52, 0.48) = 0.48.
    expect(result.adjustedFairProbability).toBeCloseTo(0.48, 6);
  });

  it("computes evPercent from the adjusted probability and combined odds", () => {
    const result = computeSgpEv([legA, legB], 1, 3.5);
    expect(result.combinedOddsDecimal).toBeCloseTo(3.5, 6);
    expect(result.evPercent).toBeCloseTo((0.52 * 0.48 * 3.5 - 1) * 100, 6);
  });

  it("never returns an adjusted probability above the least-likely single leg", () => {
    const legC = { id: "c", label: "Leg C", oddsDecimal: 3.0, fairProbability: 0.1 };
    const result = computeSgpEv([legA, legB, legC], 5, 8);
    expect(result.adjustedFairProbability).toBeLessThanOrEqual(0.1);
  });
  it("rejects mixed books, single legs, and invalid quoted odds", () => {
    expect(() => computeSgpEv([{ ...legA, sportsbookId: "one" }, { ...legB, sportsbookId: "two" }], 1, 4)).toThrow();
    expect(() => computeSgpEv([legA], 1, 4)).toThrow();
    expect(() => computeSgpEv([legA, legB], 1, NaN)).toThrow();
  });
});
