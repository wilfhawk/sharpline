import { describe, expect, it } from "vitest";
import { buildMockOddsProviderData } from "./mock-data";

describe("buildMockOddsProviderData", () => {
  it("includes exactly one sharp reference sportsbook (Pinnacle)", () => {
    const data = buildMockOddsProviderData();
    const sharpBooks = data.sportsbooks.filter((s) => s.isSharpReference);
    expect(sharpBooks).toHaveLength(1);
    expect(sharpBooks[0].slug).toBe("pinnacle");
  });

  it("builds a moneyline and a total market for every event", () => {
    const data = buildMockOddsProviderData();
    expect(data.markets).toHaveLength(data.events.length * 2);
    for (const event of data.events) {
      const eventMarkets = data.markets.filter((m) => m.event.id === event.id);
      expect(eventMarkets.map((m) => m.marketType).sort()).toEqual([
        "moneyline",
        "total",
      ]);
    }
  });

  it("every quote references a real market and sportsbook with valid decimal odds", () => {
    const data = buildMockOddsProviderData();
    const marketIds = new Set(data.markets.map((m) => m.id));
    const sportsbookIds = new Set(data.sportsbooks.map((s) => s.id));

    for (const quote of data.quotes) {
      expect(marketIds.has(quote.marketId)).toBe(true);
      expect(sportsbookIds.has(quote.sportsbookId)).toBe(true);
      expect(quote.oddsDecimalA).toBeGreaterThan(1);
      expect(quote.oddsDecimalB).toBeGreaterThan(1);
    }
  });

  it("gives Pinnacle the freshest timestamp on every market", () => {
    const data = buildMockOddsProviderData();
    const pinnacleId = data.sportsbooks.find((s) => s.isSharpReference)!.id;
    const now = Date.now();

    for (const quote of data.quotes.filter((q) => q.sportsbookId === pinnacleId)) {
      expect(now - new Date(quote.timestamp).getTime()).toBeLessThan(5_000);
    }
  });
});
