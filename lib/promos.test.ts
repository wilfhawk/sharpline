import { describe, expect, it } from "vitest";
import { convertBonusBet, evaluateDepositMatch, evaluateProfitBoost, evaluateRiskFree } from "./promos";

describe("convertBonusBet", () => {
  it("locks the same profit whichever side wins", () => {
    const { hedgeStake, profit, conversionPercent } = convertBonusBet({ bonus: 100, bonusOdds: 3, hedgeOdds: 1.5 });
    expect(hedgeStake).toBeCloseTo(133.33, 2);
    // Bonus wins: 100*(3-1) - hedge. Hedge wins: hedge*(1.5-1).
    expect(100 * 2 - hedgeStake).toBeCloseTo(profit, 6);
    expect(hedgeStake * 0.5).toBeCloseTo(profit, 6);
    expect(conversionPercent).toBeCloseTo(66.67, 2);
  });
  it("rejects invalid odds", () => {
    expect(() => convertBonusBet({ bonus: 100, bonusOdds: 1, hedgeOdds: 2 })).toThrow();
    expect(() => convertBonusBet({ bonus: 0, bonusOdds: 2, hedgeOdds: 2 })).toThrow();
  });
});

describe("evaluateProfitBoost", () => {
  it("boosts only the profit portion of the odds", () => {
    const result = evaluateProfitBoost({ stake: 100, odds: 2, boostPercent: 50, fairProbability: 0.5, hedgeOdds: null });
    expect(result.boostedOdds).toBeCloseTo(2.5);
    expect(result.evDollars).toBeCloseTo(25);
    expect(result.evPercent).toBeCloseTo(25);
    expect(result.lockedProfit).toBeNull();
  });
  it("computes an equal-profit hedge", () => {
    const result = evaluateProfitBoost({ stake: 100, odds: 2, boostPercent: 50, fairProbability: 0.5, hedgeOdds: 1.8 });
    const hedge = result.hedgeStake!;
    expect(100 * 1.5 - hedge).toBeCloseTo(result.lockedProfit!, 6);
    expect(hedge * 0.8 - 100).toBeCloseTo(result.lockedProfit!, 6);
  });
});

describe("evaluateRiskFree", () => {
  it("equalizes profit and caps the refund", () => {
    const result = evaluateRiskFree({ stake: 200, odds: 2, hedgeOdds: 2, refundCap: 100, conversionRate: 0.7 });
    expect(result.refund).toBe(100);
    const winA = 200 * 1 - result.hedgeStake;
    const winHedge = -200 + 0.7 * 100 + result.hedgeStake * 1;
    expect(winA).toBeCloseTo(winHedge, 6);
    expect(result.profit).toBeCloseTo(winA, 6);
  });
  it("is worth more as the refund converts better", () => {
    const base = { stake: 100, odds: 2, hedgeOdds: 2, refundCap: 100 };
    expect(evaluateRiskFree({ ...base, conversionRate: 0.8 }).profit).toBeGreaterThan(evaluateRiskFree({ ...base, conversionRate: 0.5 }).profit);
  });
});

describe("evaluateDepositMatch", () => {
  it("caps the bonus and charges the house edge on required wagering", () => {
    const result = evaluateDepositMatch({ deposit: 500, matchPercent: 100, maxBonus: 200, playthrough: 10, basis: "deposit_plus_bonus", holdPercent: 4.5 });
    expect(result.bonus).toBe(200);
    expect(result.wageringRequired).toBe(7000);
    expect(result.expectedCost).toBeCloseTo(315);
    expect(result.expectedValue).toBeCloseTo(-115);
  });
  it("is positive when the playthrough is light", () => {
    const result = evaluateDepositMatch({ deposit: 100, matchPercent: 100, maxBonus: 100, playthrough: 1, basis: "bonus", holdPercent: 4.5 });
    expect(result.expectedValue).toBeCloseTo(95.5);
  });
});
