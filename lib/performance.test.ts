import { describe, expect, it } from "vitest";
import { betExpectedProfit, betProfit, summarizeBets, type PerformanceBet } from "./performance";

const base: PerformanceBet = { stake: 100, odds_decimal: 2.1, fair_probability_at_bet: 0.5, placed_at: "2026-10-01T12:00:00Z", clv_percent: null };

describe("bet profit", () => {
  it("pays winners, charges losers, and returns pushes and voids", () => {
    expect(betProfit({ ...base, result: "win" })).toBeCloseTo(110);
    expect(betProfit({ ...base, result: "loss" })).toBe(-100);
    expect(betProfit({ ...base, result: "push" })).toBe(0);
    expect(betProfit({ ...base, result: "void" })).toBe(0);
    expect(betProfit({ ...base, result: null })).toBe(0);
  });
  it("computes expected value from the fair probability at bet time", () => {
    expect(betExpectedProfit(base)).toBeCloseTo(5);
  });
});

describe("summarizeBets", () => {
  it("builds a chronological equity curve with expected profit alongside", () => {
    const summary = summarizeBets([
      { ...base, result: "loss", settled_at: "2026-10-03T00:00:00Z" },
      { ...base, result: "win", settled_at: "2026-10-02T00:00:00Z" },
      { ...base, placed_at: "2026-10-04T00:00:00Z" },
    ]);
    expect(summary.settledCount).toBe(2);
    expect(summary.openCount).toBe(1);
    expect(summary.equity.map((point) => point.actual)).toEqual([110, 10]);
    expect(summary.equity.map((point) => point.expected)).toEqual([5, 10]);
    expect(summary.netProfit).toBe(10);
    expect(summary.staked).toBe(200);
    expect(summary.roiPercent).toBeCloseTo(5);
    expect(summary.winRatePercent).toBe(50);
  });
  it("excludes pushes and voids from stake, win rate, and expected profit", () => {
    const summary = summarizeBets([
      { ...base, result: "push" },
      { ...base, result: "void" },
      { ...base, result: "win" },
    ]);
    expect(summary.staked).toBe(100);
    expect(summary.winRatePercent).toBe(100);
    expect(summary.expectedProfit).toBeCloseTo(5);
  });
  it("averages only captured CLV and handles an empty list", () => {
    expect(summarizeBets([{ ...base, clv_percent: 2 }, { ...base, clv_percent: 4 }, base]).averageClvPercent).toBe(3);
    const empty = summarizeBets([]);
    expect(empty.roiPercent).toBeNull();
    expect(empty.winRatePercent).toBeNull();
    expect(empty.averageClvPercent).toBeNull();
    expect(empty.equity).toEqual([]);
  });
});
