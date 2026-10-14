import { describe, expect, it } from "vitest";
import { americanToDecimal } from "./odds-utils";
import type { OddsProviderData } from "./odds-provider";
import { closingFairProbability, scorePredictions } from "./prediction-scoring";

describe("scorePredictions", () => {
  it("returns null for no rows", () => {
    expect(scorePredictions([])).toBeNull();
  });

  it("measures error against the close and the improved share", () => {
    const card = scorePredictions([
      { referenceProbability: 0.5, modelProbability: 0.52, closingFairProbability: 0.53 },
      { referenceProbability: 0.5, modelProbability: 0.48, closingFairProbability: 0.53 },
    ])!;
    expect(card.count).toBe(2);
    expect(card.improvedShare).toBe(0.5);
    expect(card.referenceMse).toBeCloseTo(0.0009, 8);
    expect(card.modelMse).toBeCloseTo((0.01 ** 2 + 0.05 ** 2) / 2, 8);
  });

  it("buckets reliability bins and skips empty ones", () => {
    const card = scorePredictions([
      { referenceProbability: 0.1, modelProbability: 0.1, closingFairProbability: 0.12 },
      { referenceProbability: 0.9, modelProbability: 0.9, closingFairProbability: 0.88 },
    ])!;
    expect(card.bins.map((b) => b.label)).toEqual(["0-20%", "80-100%"]);
  });
});

describe("closingFairProbability", () => {
  const start = Date.parse("2026-10-14T20:00:00Z");
  const event = { id: "e", sport: "Football", league: "NFL", homeTeam: "H", awayTeam: "A", startTime: new Date(start).toISOString(), status: "upcoming" as const };
  const market = { id: "m", event, marketType: "moneyline" as const, lineValue: null, sideALabel: "H", sideBLabel: "A" };
  const quote = (sportsbookId: string, timestamp: number, a: number, b: number) => ({
    marketId: "m", sportsbookId, oddsDecimalA: americanToDecimal(a), oddsDecimalB: americanToDecimal(b), timestamp: new Date(timestamp).toISOString(),
  });
  const base: Omit<OddsProviderData, "quotes"> = {
    events: [event],
    markets: [market],
    sportsbooks: [
      { id: "pin", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true },
      { id: "soft", name: "Soft", slug: "soft", logoUrl: null, isSharpReference: false },
    ],
  };

  it("uses the sharp price posted just before kickoff", () => {
    const data = { ...base, quotes: [quote("pin", start - 60_000, -110, -110), quote("soft", start - 60_000, 105, -125)] };
    expect(closingFairProbability(data, "m", "A", start)).toBeCloseTo(0.5, 6);
  });

  it("ignores quotes outside the closing window", () => {
    const data = { ...base, quotes: [quote("pin", start - 3_600_000, -110, -110), quote("soft", start - 3_600_000, 105, -125)] };
    expect(closingFairProbability(data, "m", "A", start)).toBeNull();
  });
});
