import { findBestPrice } from "./arbitrage";
import type { OddsProviderData } from "./odds-provider";
import type { EventSummary, Sportsbook, TwoWayMarket } from "./types";

export interface MiddleLeg {
  sportsbook: Sportsbook;
  sideLabel: string;
  oddsDecimal: number;
  lineValue: number;
  /** % of total stake on this leg, chosen so a single-side win returns the same amount either way. */
  stakePercent: number;
}

/**
 * A middle: bet Over at a lower line on one book and Under at a higher line
 * on another. If the final result lands strictly between the two lines, BOTH
 * legs win (a bonus, not guaranteed like arbitrage). Otherwise exactly one
 * leg wins — stakes are sized to equalize that single-side-win payout.
 */
export interface MiddleOpportunity {
  id: string;
  event: EventSummary;
  marketType: TwoWayMarket["marketType"];
  windowLow: number;
  windowHigh: number;
  overLeg: MiddleLeg;
  underLeg: MiddleLeg;
  /** Profit % of total stake when the result lands inside the window (both legs win). */
  bothWinProfitPercent: number;
  /** Profit/loss % of total stake when the result lands outside the window (one leg wins). */
  singleWinProfitPercent: number;
}

/**
 * Scans "total" markets (Over/Under) for the same event quoted at two
 * different lines — typically because one book hasn't moved off a stale line
 * yet — and computes the resulting middle. Currently limited to totals: a
 * correct spread middle needs sign-aware (favorite vs. underdog) handling
 * that isn't implemented yet.
 */
export function computeMiddleOpportunities(data: OddsProviderData): MiddleOpportunity[] {
  const sportsbookById = new Map(data.sportsbooks.map((s) => [s.id, s]));
  const quotesByMarket = new Map<string, typeof data.quotes>();
  for (const quote of data.quotes) {
    const existing = quotesByMarket.get(quote.marketId);
    if (existing) existing.push(quote);
    else quotesByMarket.set(quote.marketId, [quote]);
  }

  const totalMarketsByEvent = new Map<string, TwoWayMarket[]>();
  for (const market of data.markets) {
    if (market.marketType !== "total" || market.lineValue === null) continue;
    const existing = totalMarketsByEvent.get(market.event.id);
    if (existing) existing.push(market);
    else totalMarketsByEvent.set(market.event.id, [market]);
  }

  const opportunities: MiddleOpportunity[] = [];

  for (const markets of totalMarketsByEvent.values()) {
    if (markets.length < 2) continue;
    const sorted = [...markets].sort((a, b) => a.lineValue! - b.lineValue!);

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const lower = sorted[i];
        const higher = sorted[j];
        if (lower.lineValue === higher.lineValue) continue; // no window, not a middle

        const bestOver = findBestPrice(
          (quotesByMarket.get(lower.id) ?? []).map((q) => ({
            sportsbookId: q.sportsbookId,
            oddsDecimal: q.oddsDecimalA,
          })),
          sportsbookById
        );
        const bestUnder = findBestPrice(
          (quotesByMarket.get(higher.id) ?? []).map((q) => ({
            sportsbookId: q.sportsbookId,
            oddsDecimal: q.oddsDecimalB,
          })),
          sportsbookById
        );
        if (!bestOver || !bestUnder) continue;

        const stakeOverPercent =
          (100 * bestUnder.oddsDecimal) / (bestOver.oddsDecimal + bestUnder.oddsDecimal);
        const stakeUnderPercent = 100 - stakeOverPercent;
        // Equal by construction: stakeOverPercent*oddsOver === stakeUnderPercent*oddsUnder.
        const equalReturn = (stakeOverPercent / 100) * bestOver.oddsDecimal * 100;

        opportunities.push({
          id: `middle-${lower.event.id}-${lower.id}-${higher.id}`,
          event: lower.event,
          marketType: lower.marketType,
          windowLow: lower.lineValue!,
          windowHigh: higher.lineValue!,
          overLeg: {
            sportsbook: bestOver.sportsbook,
            sideLabel: lower.sideALabel,
            oddsDecimal: bestOver.oddsDecimal,
            lineValue: lower.lineValue!,
            stakePercent: stakeOverPercent,
          },
          underLeg: {
            sportsbook: bestUnder.sportsbook,
            sideLabel: higher.sideBLabel,
            oddsDecimal: bestUnder.oddsDecimal,
            lineValue: higher.lineValue!,
            stakePercent: stakeUnderPercent,
          },
          bothWinProfitPercent: 2 * equalReturn - 100,
          singleWinProfitPercent: equalReturn - 100,
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.bothWinProfitPercent - a.bothWinProfitPercent);
}
