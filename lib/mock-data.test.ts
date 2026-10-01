import { describe, expect, it } from "vitest";
import { buildMockOddsProviderData } from "./mock-data";

describe("buildMockOddsProviderData", () => {
  it("includes three sharp reference sportsbooks, ordered by priority", () => {
    const data = buildMockOddsProviderData();
    const sharpBooks = data.sportsbooks.filter((s) => s.isSharpReference);
    expect(sharpBooks).toHaveLength(3);
    expect(sharpBooks.map((s) => s.slug).sort()).toEqual([
      "betonline",
      "circa",
      "pinnacle",
    ]);
    const pinnacle = sharpBooks.find((s) => s.slug === "pinnacle")!;
    const circa = sharpBooks.find((s) => s.slug === "circa")!;
    expect(pinnacle.sharpPriority).toBeLessThan(circa.sharpPriority!);
  });

  it("builds a moneyline market and at least one total market for every event", () => {
    const data = buildMockOddsProviderData();
    for (const event of data.events) {
      const eventMarkets = data.markets.filter((m) => m.event.id === event.id);
      const types = eventMarkets.map((m) => m.marketType);
      expect(types.filter((t) => t === "moneyline")).toHaveLength(1);
      expect(types.filter((t) => t === "total").length).toBeGreaterThanOrEqual(1);
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

  it("gives every sharp reference book the freshest timestamp on markets it quotes", () => {
    const data = buildMockOddsProviderData();
    const sharpIds = new Set(
      data.sportsbooks.filter((s) => s.isSharpReference).map((s) => s.id)
    );
    const now = Date.now();

    for (const quote of data.quotes.filter((q) => sharpIds.has(q.sportsbookId))) {
      expect(now - new Date(quote.timestamp).getTime()).toBeLessThan(5_000);
    }
  });

  it("includes at least one event with an alternate total line (for middles)", () => {
    const data = buildMockOddsProviderData();
    const totalMarketsByEvent = new Map<string, number>();
    for (const market of data.markets) {
      if (market.marketType !== "total") continue;
      totalMarketsByEvent.set(
        market.event.id,
        (totalMarketsByEvent.get(market.event.id) ?? 0) + 1
      );
    }
    expect([...totalMarketsByEvent.values()].some((count) => count > 1)).toBe(true);
  });

  it("leaves Pinnacle without a quote on at least one market (sharp-reference fallback demo)", () => {
    const data = buildMockOddsProviderData();
    const pinnacleId = data.sportsbooks.find((s) => s.slug === "pinnacle")!.id;
    const pinnacleMarketIds = new Set(
      data.quotes.filter((q) => q.sportsbookId === pinnacleId).map((q) => q.marketId)
    );
    const marketsMissingPinnacle = data.markets.filter((m) => !pinnacleMarketIds.has(m.id));
    expect(marketsMissingPinnacle.length).toBeGreaterThan(0);
  });
});
