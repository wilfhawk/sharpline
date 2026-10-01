import type { OddsProviderData } from "./odds-provider";
import type { EventSummary, MarketSide, Sportsbook, TwoWayMarket } from "./types";

/** A guaranteed-profit opportunity: the best price for each side comes from two different books. */
export interface ArbitrageOpportunity {
  id: string;
  event: EventSummary;
  market: TwoWayMarket;
  sideA: ArbitrageLeg;
  sideB: ArbitrageLeg;
  /** Guaranteed profit % of total stake, regardless of which side wins. */
  profitPercent: number;
}

export interface ArbitrageLeg {
  sportsbook: Sportsbook;
  side: MarketSide;
  sideLabel: string;
  oddsDecimal: number;
  /** % of total stake to place on this leg so both outcomes return the same profit. */
  stakePercent: number;
}

interface BestPrice {
  sportsbook: Sportsbook;
  oddsDecimal: number;
}

/** Finds the best (highest decimal) price among a set of book quotes for one side. Exported for reuse by middles.ts. */
export function findBestPrice(
  quotes: { sportsbookId: string; oddsDecimal: number }[],
  sportsbookById: Map<string, Sportsbook>
): BestPrice | undefined {
  let best: BestPrice | undefined;
  for (const quote of quotes) {
    const sportsbook = sportsbookById.get(quote.sportsbookId);
    if (!sportsbook) continue;
    if (!best || quote.oddsDecimal > best.oddsDecimal) {
      best = { sportsbook, oddsDecimal: quote.oddsDecimal };
    }
  }
  return best;
}

/**
 * Scans every market for a cross-book arbitrage: the best side-A price at one
 * book plus the best side-B price at another book summing to < 100% implied
 * probability. Unlike +EV detection, this does not need a Pinnacle reference —
 * it only compares sportsbooks against each other.
 */
export function computeArbitrageOpportunities(
  data: OddsProviderData
): ArbitrageOpportunity[] {
  const sportsbookById = new Map(data.sportsbooks.map((s) => [s.id, s]));
  const marketById = new Map(data.markets.map((m) => [m.id, m]));
  const quotesByMarket = new Map<string, typeof data.quotes>();
  for (const quote of data.quotes) {
    const existing = quotesByMarket.get(quote.marketId);
    if (existing) existing.push(quote);
    else quotesByMarket.set(quote.marketId, [quote]);
  }

  const opportunities: ArbitrageOpportunity[] = [];

  for (const [marketId, quotes] of quotesByMarket) {
    const market = marketById.get(marketId);
    if (!market) continue;

    const bestA = findBestPrice(
      quotes.map((q) => ({ sportsbookId: q.sportsbookId, oddsDecimal: q.oddsDecimalA })),
      sportsbookById
    );
    const bestB = findBestPrice(
      quotes.map((q) => ({ sportsbookId: q.sportsbookId, oddsDecimal: q.oddsDecimalB })),
      sportsbookById
    );
    if (!bestA || !bestB) continue;

    const impliedA = 1 / bestA.oddsDecimal;
    const impliedB = 1 / bestB.oddsDecimal;
    const totalImplied = impliedA + impliedB;
    if (totalImplied >= 1) continue; // no arbitrage

    const profitPercent = (1 / totalImplied - 1) * 100;

    opportunities.push({
      id: `arb-${market.id}`,
      event: market.event,
      market,
      sideA: {
        sportsbook: bestA.sportsbook,
        side: "A",
        sideLabel: market.sideALabel,
        oddsDecimal: bestA.oddsDecimal,
        stakePercent: (impliedA / totalImplied) * 100,
      },
      sideB: {
        sportsbook: bestB.sportsbook,
        side: "B",
        sideLabel: market.sideBLabel,
        oddsDecimal: bestB.oddsDecimal,
        stakePercent: (impliedB / totalImplied) * 100,
      },
      profitPercent,
    });
  }

  return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
}
