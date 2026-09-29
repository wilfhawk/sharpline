import { describe, expect, it } from "vitest";
import {
  devigMultiplicative,
  devigPower,
  calculateFairProbabilities,
  computeEV,
  findPositiveEV,
  type EvCandidate,
} from "./ev-engine";

describe("devigMultiplicative", () => {
  it("splits symmetric vig-laden odds into 50/50 fair probabilities", () => {
    // -110/-110 -> decimal 1.909091 each -> raw implied prob ~0.5238 each
    const { fairProbabilityA, fairProbabilityB } = devigMultiplicative(
      1.909091,
      1.909091
    );
    expect(fairProbabilityA).toBeCloseTo(0.5, 3);
    expect(fairProbabilityB).toBeCloseTo(0.5, 3);
  });

  it("produces probabilities that sum to 1 for skewed odds", () => {
    const { fairProbabilityA, fairProbabilityB } = devigMultiplicative(
      1.5,
      3.0
    );
    expect(fairProbabilityA + fairProbabilityB).toBeCloseTo(1, 5);
    expect(fairProbabilityA).toBeGreaterThan(fairProbabilityB);
  });

  it("throws on non-positive decimal odds", () => {
    expect(() => devigMultiplicative(0, 2)).toThrow();
    expect(() => devigMultiplicative(2, -1)).toThrow();
  });
});

describe("devigPower", () => {
  it("splits symmetric vig-laden odds into 50/50 fair probabilities", () => {
    const { fairProbabilityA, fairProbabilityB } = devigPower(
      1.909091,
      1.909091
    );
    expect(fairProbabilityA).toBeCloseTo(0.5, 3);
    expect(fairProbabilityB).toBeCloseTo(0.5, 3);
  });

  it("produces probabilities that sum to 1 for skewed odds", () => {
    const { fairProbabilityA, fairProbabilityB } = devigPower(1.5, 3.0);
    expect(fairProbabilityA + fairProbabilityB).toBeCloseTo(1, 5);
    expect(fairProbabilityA).toBeGreaterThan(fairProbabilityB);
  });
});

describe("calculateFairProbabilities", () => {
  it("defaults to the multiplicative method", () => {
    const multiplicative = devigMultiplicative(1.8, 2.2);
    const result = calculateFairProbabilities(1.8, 2.2);
    expect(result).toEqual(multiplicative);
  });

  it("dispatches to the power method when requested", () => {
    const power = devigPower(1.8, 2.2);
    const result = calculateFairProbabilities(1.8, 2.2, "power");
    expect(result).toEqual(power);
  });
});

describe("computeEV", () => {
  it("computes positive EV when fair value exceeds break-even", () => {
    // fair prob 0.5 at decimal odds 2.10 -> (0.5*2.10) - 1 = 0.05 (5%)
    expect(computeEV(0.5, 2.1)).toBeCloseTo(0.05, 5);
  });

  it("computes negative EV when odds are worse than fair value", () => {
    expect(computeEV(0.5, 1.9)).toBeCloseTo(-0.05, 5);
  });

  it("computes zero EV at fair odds", () => {
    expect(computeEV(0.5, 2.0)).toBeCloseTo(0, 5);
  });
});

describe("findPositiveEV", () => {
  const candidates: EvCandidate[] = [
    { id: "a", evPercent: 5.2 },
    { id: "b", evPercent: 1.5 },
    { id: "c", evPercent: -2.0 },
    { id: "d", evPercent: 2.0 },
    { id: "e", evPercent: 8.1 },
  ];

  it("filters out candidates below the default 2% threshold", () => {
    const result = findPositiveEV(candidates);
    expect(result.map((c) => c.id)).toEqual(["e", "a", "d"]);
  });

  it("sorts remaining candidates by EV% descending", () => {
    const result = findPositiveEV(candidates);
    expect(result[0].evPercent).toBeGreaterThanOrEqual(result[1].evPercent);
    expect(result[1].evPercent).toBeGreaterThanOrEqual(result[2].evPercent);
  });

  it("respects a custom minimum threshold", () => {
    const result = findPositiveEV(candidates, 5);
    expect(result.map((c) => c.id)).toEqual(["e", "a"]);
  });
});
