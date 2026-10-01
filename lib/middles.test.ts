import { describe, expect, it } from "vitest";
import { americanToDecimal } from "./odds-utils";
import { computeMiddleOpportunities } from "./middles";
import type { OddsProviderData } from "./odds-provider";

function buildFixture(): OddsProviderData {
  const event = {
    id: "evt-1",
    sport: "Football",
    league: "NFL",
    homeTeam: "Home",
    awayTeam: "Away",
    startTime: new Date().toISOString(),
    status: "upcoming" as const,
  };

  const lowerMarket = {
    id: "mkt-total-46",
    event,
    marketType: "total" as const,
    lineValue: 46,
    sideALabel: "Over 46",
    sideBLabel: "Under 46",
  };
  const higherMarket = {
    id: "mkt-total-48",
    event,
    marketType: "total" as const,
    lineValue: 48,
    sideALabel: "Over 48",
    sideBLabel: "Under 48",
  };

  return {
    sportsbooks: [
      { id: "sb-a", name: "Book A", slug: "a", logoUrl: null, isSharpReference: false },
      { id: "sb-b", name: "Book B", slug: "b", logoUrl: null, isSharpReference: false },
    ],
    events: [event],
    markets: [lowerMarket, higherMarket],
    quotes: [
      {
        marketId: "mkt-total-46",
        sportsbookId: "sb-a",
        oddsDecimalA: americanToDecimal(-105), // Over 46 at Book A
        oddsDecimalB: americanToDecimal(-115),
        timestamp: new Date().toISOString(),
      },
      {
        marketId: "mkt-total-48",
        sportsbookId: "sb-b",
        oddsDecimalA: americanToDecimal(-110),
        oddsDecimalB: americanToDecimal(-110), // Under 48 at Book B
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

describe("computeMiddleOpportunities", () => {
  it("finds a middle between two different total lines on the same event", () => {
    const opportunities = computeMiddleOpportunities(buildFixture());
    expect(opportunities).toHaveLength(1);
    expect(opportunities[0].windowLow).toBe(46);
    expect(opportunities[0].windowHigh).toBe(48);
  });

  it("picks the Over leg from the lower line and the Under leg from the higher line", () => {
    const [middle] = computeMiddleOpportunities(buildFixture());
    expect(middle.overLeg.sportsbook.id).toBe("sb-a");
    expect(middle.overLeg.lineValue).toBe(46);
    expect(middle.underLeg.sportsbook.id).toBe("sb-b");
    expect(middle.underLeg.lineValue).toBe(48);
  });

  it("sizes stakes so a single-side win returns the same amount either way", () => {
    const [middle] = computeMiddleOpportunities(buildFixture());
    const overReturn = (middle.overLeg.stakePercent / 100) * middle.overLeg.oddsDecimal * 100;
    const underReturn = (middle.underLeg.stakePercent / 100) * middle.underLeg.oddsDecimal * 100;
    expect(overReturn).toBeCloseTo(underReturn, 6);
    expect(middle.singleWinProfitPercent).toBeCloseTo(overReturn - 100, 6);
  });

  it("both-win profit is exactly double the single-win profit plus 100", () => {
    const [middle] = computeMiddleOpportunities(buildFixture());
    expect(middle.bothWinProfitPercent).toBeCloseTo(
      2 * (middle.singleWinProfitPercent + 100) - 100,
      6
    );
  });

  it("stake percentages sum to 100", () => {
    const [middle] = computeMiddleOpportunities(buildFixture());
    expect(middle.overLeg.stakePercent + middle.underLeg.stakePercent).toBeCloseTo(100, 6);
  });

  it("returns nothing when an event has only one total line", () => {
    const fixture = buildFixture();
    fixture.markets = [fixture.markets[0]];
    fixture.quotes = fixture.quotes.filter((q) => q.marketId === "mkt-total-46");
    expect(computeMiddleOpportunities(fixture)).toEqual([]);
  });

  it("returns nothing for non-total market types", () => {
    const fixture = buildFixture();
    fixture.markets = fixture.markets.map((m) => ({ ...m, marketType: "moneyline" as const }));
    expect(computeMiddleOpportunities(fixture)).toEqual([]);
  });
});
