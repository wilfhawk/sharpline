import { describe, expect, it } from "vitest";
import { computeArbitrageOpportunities } from "./arbitrage";
import type { OddsProviderData } from "./odds-provider";
import type { EventSummary, Sportsbook, TwoWayMarket } from "./types";

const event: EventSummary = {
  id: "evt-1",
  sport: "Basketball",
  league: "NBA",
  homeTeam: "Warriors",
  awayTeam: "Lakers",
  startTime: new Date(Date.now() + 3_600_000).toISOString(),
  status: "upcoming",
};

const books: Sportsbook[] = [
  { id: "sb-a", name: "Book A", slug: "book-a", logoUrl: null, isSharpReference: false },
  { id: "sb-b", name: "Book B", slug: "book-b", logoUrl: null, isSharpReference: false },
];

const market: TwoWayMarket = {
  id: "mkt-1",
  event,
  marketType: "moneyline",
  lineValue: null,
  sideALabel: "Warriors ML",
  sideBLabel: "Lakers ML",
};

function buildData(oddsA: [number, number], oddsB: [number, number]): OddsProviderData {
  return {
    sportsbooks: books,
    events: [event],
    markets: [market],
    quotes: [
      { marketId: market.id, sportsbookId: "sb-a", oddsDecimalA: oddsA[0], oddsDecimalB: oddsA[1], timestamp: new Date().toISOString() },
      { marketId: market.id, sportsbookId: "sb-b", oddsDecimalA: oddsB[0], oddsDecimalB: oddsB[1], timestamp: new Date().toISOString() },
    ],
  };
}

describe("computeArbitrageOpportunities", () => {
  it("finds a cross-book arbitrage when combined implied probability < 100%", () => {
    // Book A best on side A (2.10), Book B best on side B (2.10) -> 1/2.1 + 1/2.1 = 0.952 < 1
    const data = buildData([2.1, 1.8], [1.9, 2.1]);
    const opps = computeArbitrageOpportunities(data);

    expect(opps).toHaveLength(1);
    expect(opps[0].sideA.sportsbook.id).toBe("sb-a");
    expect(opps[0].sideA.oddsDecimal).toBe(2.1);
    expect(opps[0].sideB.sportsbook.id).toBe("sb-b");
    expect(opps[0].sideB.oddsDecimal).toBe(2.1);
    expect(opps[0].profitPercent).toBeGreaterThan(0);
    expect(opps[0].sideA.stakePercent + opps[0].sideB.stakePercent).toBeCloseTo(100, 5);
  });

  it("returns nothing when no cross-book arbitrage exists", () => {
    // Both books have >100% implied probability (typical vig) on their own lines
    const data = buildData([1.9, 1.9], [1.85, 1.85]);
    expect(computeArbitrageOpportunities(data)).toHaveLength(0);
  });

  it("skips markets with no quotes", () => {
    const data: OddsProviderData = { sportsbooks: books, events: [event], markets: [market], quotes: [] };
    expect(computeArbitrageOpportunities(data)).toHaveLength(0);
  });
});
