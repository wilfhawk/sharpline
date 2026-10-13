import type { OddsProviderData } from "./odds-provider";

export function usableFeed(data: OddsProviderData, observedAt: number, maxAgeMs = 300_000): OddsProviderData {
  const markets = data.markets.filter((market) => market.event.status !== "final");
  const marketIds = new Set(markets.map((market) => market.id));
  return {
    ...data,
    markets,
    quotes: data.quotes.filter((quote) => {
      const age = observedAt - Date.parse(quote.timestamp);
      return marketIds.has(quote.marketId) && Number.isFinite(age) && age >= -30_000 && age <= maxAgeMs
        && Number.isFinite(quote.oddsDecimalA) && quote.oddsDecimalA > 1
        && Number.isFinite(quote.oddsDecimalB) && quote.oddsDecimalB > 1;
    }),
  };
}