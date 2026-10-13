import { calculateFairProbabilities, computeEV } from "./ev-engine";
import { bookSiteUrl } from "./books";
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

/** Props rarely have a sharp quote, so fair odds come from the other books' average de-vigged price. */
export const MIN_CONSENSUS_BOOKS = 3;

interface ConsensusFair {
  fairProbabilityA: number;
  fairProbabilityB: number;
  bookCount: number;
  timestamp: string;
}

function consensusFair(
  marketQuotes: OddsQuote[],
  excludeSportsbookId: string,
  method: DevigMethod
): ConsensusFair | undefined {
  const others = marketQuotes.filter((quote) => quote.sportsbookId !== excludeSportsbookId);
  if (others.length < MIN_CONSENSUS_BOOKS) return undefined;
  let sumA = 0;
  let latest = 0;
  for (const quote of others) {
    sumA += calculateFairProbabilities(quote.oddsDecimalA, quote.oddsDecimalB, method).fairProbabilityA;
    latest = Math.max(latest, Date.parse(quote.timestamp));
  }
  const fairProbabilityA = sumA / others.length;
  return {
    fairProbabilityA,
    fairProbabilityB: 1 - fairProbabilityA,
    bookCount: others.length,
    timestamp: new Date(latest).toISOString(),
  };
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
    if (!sharpQuote) {
      if (market.marketType !== "player_prop") continue;
      for (const quote of marketQuotes) {
        const sportsbook = sportsbookById.get(quote.sportsbookId);
        if (!sportsbook) continue;
        const consensus = consensusFair(marketQuotes, quote.sportsbookId, method);
        if (!consensus) continue;
        const extras = { referenceBook: `Market consensus (${consensus.bookCount} books)`, referenceTimestamp: consensus.timestamp, devigMethod: method };
        opportunities.push({ ...buildOpportunity(market, sportsbook, quote, "A", consensus.fairProbabilityA), ...extras });
        opportunities.push({ ...buildOpportunity(market, sportsbook, quote, "B", consensus.fairProbabilityB), ...extras });
      }
      continue;
    }

    const fair = calculateFairProbabilities(
      sharpQuote.oddsDecimalA,
      sharpQuote.oddsDecimalB,
      method
    );

    for (const quote of marketQuotes) {
      const sportsbook = sportsbookById.get(quote.sportsbookId);
      if (!sportsbook || sportsbook.isSharpReference) continue;
      if (Math.abs(Date.parse(quote.timestamp) - Date.parse(sharpQuote.timestamp)) > 60_000) continue;

      opportunities.push(
        { ...buildOpportunity(market, sportsbook, quote, "A", fair.fairProbabilityA), referenceBook: sportsbookById.get(sharpQuote.sportsbookId)?.name, referenceTimestamp: sharpQuote.timestamp, devigMethod: method }
      );
      opportunities.push(
        { ...buildOpportunity(market, sportsbook, quote, "B", fair.fairProbabilityB), referenceBook: sportsbookById.get(sharpQuote.sportsbookId)?.name, referenceTimestamp: sharpQuote.timestamp, devigMethod: method }
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
    betLink: (side === "A" ? quote.linkA : quote.linkB) ?? bookSiteUrl(sportsbook.slug),
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
  const sharpFair = sharpQuote
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
    const fair =
      sharpFair ??
      (market.marketType === "player_prop" ? consensusFair(marketQuotes, quote.sportsbookId, method) : undefined);

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
        betLink: (side === "A" ? quote.linkA : quote.linkB) ?? bookSiteUrl(sportsbook.slug),
        evPercent:
          sportsbook.isSharpReference || fairProbability === undefined || (sharpQuote && Math.abs(Date.parse(quote.timestamp) - Date.parse(sharpQuote.timestamp)) > 60_000)
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
