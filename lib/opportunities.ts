import { calculateFairProbabilities, computeEV } from "./ev-engine";
import type { OddsProviderData } from "./odds-provider";
import type {
  BookComparisonRow,
  DevigMethod,
  EvOpportunity,
  OddsQuote,
  Sportsbook,
  TwoWayMarket,
} from "./types";

/**
 * Picks the fair-odds benchmark quote among all sharp reference books that
 * quoted this market, preferring the lowest `sharpPriority` (e.g. Pinnacle
 * over Circa over BetOnline) and falling back to the next sharp book when the
 * most-preferred one hasn't posted a line for this market.
 */
function findSharpQuote(
  marketQuotes: OddsQuote[],
  sportsbookById: Map<string, Sportsbook>
): OddsQuote | undefined {
  let best: { quote: OddsQuote; priority: number } | undefined;
  for (const quote of marketQuotes) {
    const sportsbook = sportsbookById.get(quote.sportsbookId);
    if (!sportsbook?.isSharpReference) continue;
    const priority = sportsbook.sharpPriority ?? Number.MAX_SAFE_INTEGER;
    if (!best || priority < best.priority) {
      best = { quote, priority };
    }
  }
  return best?.quote;
}

function groupQuotesByMarket(quotes: OddsQuote[]): Map<string, OddsQuote[]> {
  const byMarket = new Map<string, OddsQuote[]>();
  for (const quote of quotes) {
    const existing = byMarket.get(quote.marketId);
    if (existing) {
      existing.push(quote);
    } else {
      byMarket.set(quote.marketId, [quote]);
    }
  }
  return byMarket;
}

/**
 * Compares every non-reference book's odds against the Pinnacle-derived fair
 * odds for every market, producing one EvOpportunity per book per side.
 * Markets with no Pinnacle quote are skipped (no fair-odds benchmark).
 */
export function computeAllOpportunities(
  data: OddsProviderData,
  method: DevigMethod = "multiplicative"
): EvOpportunity[] {
  const sportsbookById = new Map(data.sportsbooks.map((s) => [s.id, s]));
  const marketById = new Map(data.markets.map((m) => [m.id, m]));
  const quotesByMarket = groupQuotesByMarket(data.quotes);

  const opportunities: EvOpportunity[] = [];

  for (const [marketId, marketQuotes] of quotesByMarket) {
    const market = marketById.get(marketId);
    if (!market) continue;

    const sharpQuote = findSharpQuote(marketQuotes, sportsbookById);
    if (!sharpQuote) continue;

    const fair = calculateFairProbabilities(
      sharpQuote.oddsDecimalA,
      sharpQuote.oddsDecimalB,
      method
    );

    for (const quote of marketQuotes) {
      const sportsbook = sportsbookById.get(quote.sportsbookId);
      if (!sportsbook || sportsbook.isSharpReference) continue;

      opportunities.push(
        buildOpportunity(market, sportsbook, quote, "A", fair.fairProbabilityA)
      );
      opportunities.push(
        buildOpportunity(market, sportsbook, quote, "B", fair.fairProbabilityB)
      );
    }
  }

  return opportunities;
}

function buildOpportunity(
  market: TwoWayMarket,
  sportsbook: Sportsbook,
  quote: OddsQuote,
  side: "A" | "B",
  fairProbability: number
): EvOpportunity {
  const oddsDecimal = side === "A" ? quote.oddsDecimalA : quote.oddsDecimalB;
  const sideLabel = side === "A" ? market.sideALabel : market.sideBLabel;
  const evPercent = computeEV(fairProbability, oddsDecimal) * 100;

  return {
    id: `${market.id}-${sportsbook.id}-${side}`,
    event: market.event,
    market,
    sportsbook,
    side,
    sideLabel,
    oddsDecimal,
    fairOddsDecimal: 1 / fairProbability,
    fairProbability,
    evPercent,
    snapshotTimestamp: quote.timestamp,
  };
}

/** Every tracked book's current price for one exact market, sharp reference first. */
export function buildBookComparisonRows(
  data: OddsProviderData,
  marketId: string,
  method: DevigMethod = "multiplicative"
): BookComparisonRow[] {
  const sportsbookById = new Map(data.sportsbooks.map((s) => [s.id, s]));
  const market = data.markets.find((m) => m.id === marketId);
  if (!market) return [];

  const marketQuotes = data.quotes.filter((q) => q.marketId === marketId);
  const sharpQuote = findSharpQuote(marketQuotes, sportsbookById);
  const fair = sharpQuote
    ? calculateFairProbabilities(
        sharpQuote.oddsDecimalA,
        sharpQuote.oddsDecimalB,
        method
      )
    : undefined;

  const rows: BookComparisonRow[] = [];
  for (const quote of marketQuotes) {
    const sportsbook = sportsbookById.get(quote.sportsbookId);
    if (!sportsbook) continue;

    for (const side of ["A", "B"] as const) {
      const oddsDecimal = side === "A" ? quote.oddsDecimalA : quote.oddsDecimalB;
      const sideLabel = side === "A" ? market.sideALabel : market.sideBLabel;
      const fairProbability =
        side === "A" ? fair?.fairProbabilityA : fair?.fairProbabilityB;

      rows.push({
        sportsbook,
        side,
        sideLabel,
        oddsDecimal,
        evPercent:
          sportsbook.isSharpReference || fairProbability === undefined
            ? null
            : computeEV(fairProbability, oddsDecimal) * 100,
      });
    }
  }

  return rows.sort((a, b) => {
    if (a.sportsbook.isSharpReference !== b.sportsbook.isSharpReference) {
      return a.sportsbook.isSharpReference ? -1 : 1;
    }
    return (b.evPercent ?? -Infinity) - (a.evPercent ?? -Infinity);
  });
}
