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

describe("sharp reference priority fallback", () => {
  function buildMultiSharpFixture(pinnacleHasQuote: boolean): OddsProviderData {
    const event = {
      id: "evt-2",
      sport: "Football",
      league: "NFL",
      homeTeam: "Home",
      awayTeam: "Away",
      startTime: new Date().toISOString(),
      status: "upcoming" as const,
    };
    const market = {
      id: "mkt-2",
      event,
      marketType: "moneyline" as const,
      lineValue: null,
      sideALabel: "Home ML",
      sideBLabel: "Away ML",
    };

    const quotes = [
      {
        marketId: "mkt-2",
        sportsbookId: "sb-circa",
        // Deliberately a different line than Pinnacle's, so the two produce
        // distinguishable fair-odds benchmarks for the fallback assertion below.
        oddsDecimalA: americanToDecimal(-130),
        oddsDecimalB: americanToDecimal(110),
        timestamp: new Date().toISOString(),
      },
      {
        marketId: "mkt-2",
        sportsbookId: "sb-other",
        oddsDecimalA: americanToDecimal(130),
        oddsDecimalB: americanToDecimal(-200),
        timestamp: new Date().toISOString(),
      },
    ];
    if (pinnacleHasQuote) {
      quotes.unshift({
        marketId: "mkt-2",
        sportsbookId: "sb-pinnacle",
        oddsDecimalA: americanToDecimal(-110),
        oddsDecimalB: americanToDecimal(-110),
        timestamp: new Date().toISOString(),
      });
    }

    return {
      sportsbooks: [
        { id: "sb-pinnacle", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true, sharpPriority: 0 },
        { id: "sb-circa", name: "Circa Sports", slug: "circa", logoUrl: null, isSharpReference: true, sharpPriority: 1 },
        { id: "sb-other", name: "OtherBook", slug: "other", logoUrl: null, isSharpReference: false },
      ],
      events: [event],
      markets: [market],
      quotes,
    };
  }

  it("prefers Pinnacle (lower sharpPriority) over Circa, and falls back to Circa's distinct line when Pinnacle is absent", () => {
    const withPinnacle = computeAllOpportunities(buildMultiSharpFixture(true));
    const withoutPinnacle = computeAllOpportunities(buildMultiSharpFixture(false));

    const sideAWithPinnacle = withPinnacle.find((o) => o.sportsbook.id === "sb-other" && o.side === "A")!;
    const sideAWithCircaFallback = withoutPinnacle.find(
      (o) => o.sportsbook.id === "sb-other" && o.side === "A"
    )!;

    // Pinnacle's -110/-110 line and Circa's -130/+110 line are deliberately
    // different, so the resulting EV% must differ between the two scenarios —
    // proving the fallback actually used Circa's own line, not Pinnacle's.
    expect(sideAWithPinnacle.evPercent).not.toBeCloseTo(sideAWithCircaFallback.evPercent, 1);
  });

  it("falls back to Circa when Pinnacle has no quote for the market", () => {
    const withPinnacle = computeAllOpportunities(buildMultiSharpFixture(true));
    const withoutPinnacle = computeAllOpportunities(buildMultiSharpFixture(false));
    // Without Pinnacle, Circa becomes the fair-odds source instead of the market being skipped entirely.
    expect(withoutPinnacle.length).toBeGreaterThan(0);
    expect(withPinnacle.length).toBe(withoutPinnacle.length);
  });

  it("never treats a sharp reference book itself as a bettable opportunity", () => {
    const opportunities = computeAllOpportunities(buildMultiSharpFixture(true));
    expect(opportunities.every((o) => o.sportsbook.id !== "sb-circa")).toBe(true);
  });
});
