import { describe, expect, it } from "vitest";
import { americanToDecimal } from "./odds-utils";
import { buildBookComparisonRows, computeAllOpportunities } from "./opportunities";
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

  const market = {
    id: "mkt-1",
    event,
    marketType: "moneyline" as const,
    lineValue: null,
    sideALabel: "Home ML",
    sideBLabel: "Away ML",
  };

  return {
    sportsbooks: [
      { id: "sb-pinnacle", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true },
      { id: "sb-other", name: "OtherBook", slug: "other", logoUrl: null, isSharpReference: false },
    ],
    events: [event],
    markets: [market],
    quotes: [
      {
        marketId: "mkt-1",
        sportsbookId: "sb-pinnacle",
        oddsDecimalA: americanToDecimal(-110),
        oddsDecimalB: americanToDecimal(-110),
        timestamp: new Date().toISOString(),
      },
      {
        marketId: "mkt-1",
        sportsbookId: "sb-other",
        // Better than Pinnacle fair (~1.909) on side A -> positive EV.
        oddsDecimalA: americanToDecimal(130),
        // Worse than Pinnacle fair on side B -> negative EV.
        oddsDecimalB: americanToDecimal(-200),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

describe("computeAllOpportunities", () => {
  it("skips the sharp reference book itself", () => {
    const opportunities = computeAllOpportunities(buildFixture());
    expect(opportunities.every((o) => o.sportsbook.id !== "sb-pinnacle")).toBe(
      true
    );
  });

  it("produces one opportunity per side per non-reference book", () => {
    const opportunities = computeAllOpportunities(buildFixture());
    expect(opportunities).toHaveLength(2);
  });

  it("flags positive EV on the side with better-than-fair odds", () => {
    const opportunities = computeAllOpportunities(buildFixture());
    const sideA = opportunities.find((o) => o.side === "A")!;
    const sideB = opportunities.find((o) => o.side === "B")!;
    expect(sideA.evPercent).toBeGreaterThan(0);
    expect(sideB.evPercent).toBeLessThan(0);
  });

  it("skips markets with no Pinnacle quote", () => {
    const fixture = buildFixture();
    fixture.quotes = fixture.quotes.filter(
      (q) => q.sportsbookId !== "sb-pinnacle"
    );
    expect(computeAllOpportunities(fixture)).toHaveLength(0);
  });
});

describe("buildBookComparisonRows", () => {
  it("includes the sharp reference book with a null EV%", () => {
    const rows = buildBookComparisonRows(buildFixture(), "mkt-1");
    const pinnacleRows = rows.filter((r) => r.sportsbook.id === "sb-pinnacle");
    expect(pinnacleRows).toHaveLength(2);
    expect(pinnacleRows.every((r) => r.evPercent === null)).toBe(true);
  });

  it("lists the sharp reference book first", () => {
    const rows = buildBookComparisonRows(buildFixture(), "mkt-1");
    expect(rows[0].sportsbook.isSharpReference).toBe(true);
  });

  it("returns an empty array for an unknown market id", () => {
    expect(buildBookComparisonRows(buildFixture(), "nope")).toEqual([]);
  });
});
