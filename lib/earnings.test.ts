import { describe, expect, it } from "vitest";
import { projectEarnings, type EarningsInputs } from "./earnings";

const input: EarningsInputs = { bankroll: 1000, stakePercent: 1, betsPerMonth: 100, months: 1, decimalOdds: 2, edgePercent: 0, monthlyCost: 0 };

describe("earnings scenarios", () => {
  it("matches a fair coin distribution and includes losses", () => {
    const result = projectEarnings(input);
    expect(result.final.expected).toBe(0);
    expect(result.final.lossProbability).toBeCloseTo(0.460205, 5);
    expect(result.final.lower).toBeLessThan(0);
    expect(result.final.upper).toBeGreaterThan(0);
  });
  it("deducts subscription costs and uses fixed stakes", () => {
    const result = projectEarnings({ ...input, edgePercent: 5, monthlyCost: 25, months: 6 });
    expect(result.stake).toBe(10);
    expect(result.final.expected).toBeCloseTo(150);
    expect(result.turnover).toBe(6000);
  });
  it("supports negative edge and rejects impossible assumptions", () => {
    expect(projectEarnings({ ...input, edgePercent: -5 }).final.expected).toBe(-50);
    expect(() => projectEarnings({ ...input, decimalOdds: 1.01, edgePercent: 20 })).toThrow();
    expect(() => projectEarnings({ ...input, months: Infinity })).toThrow();
  });
});