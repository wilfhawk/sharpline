import type { OddsProviderData } from "./odds-provider";

// Books refresh player props far less often than featured lines.
const PROP_MAX_AGE_MS = 900_000;

export function usableFeed(data: OddsProviderData, observedAt: number, maxAgeMs = 300_000): OddsProviderData {
  const markets = data.markets.filter((market) => market.event.status !== "final");
  const marketIds = new Set(markets.map((market) => market.id));
  const propMarketIds = new Set(markets.filter((market) => market.marketType === "player_prop").map((market) => market.id));
  return {
    ...data,
    markets,
    quotes: data.quotes.filter((quote) => {
      const age = observedAt - Date.parse(quote.timestamp);
      const limit = propMarketIds.has(quote.marketId) ? Math.max(maxAgeMs, PROP_MAX_AGE_MS) : maxAgeMs;
      return marketIds.has(quote.marketId) && Number.isFinite(age) && age >= -30_000 && age <= limit
        && Number.isFinite(quote.oddsDecimalA) && quote.oddsDecimalA > 1
        && Number.isFinite(quote.oddsDecimalB) && quote.oddsDecimalB > 1;
    }),
  };
}