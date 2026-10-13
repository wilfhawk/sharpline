/** One parlay leg's offered price and de-vigged fair probability (from an EvOpportunity). */
export interface SgpLegInput {
  id: string;
  label: string;
  oddsDecimal: number;
  fairProbability: number;
  sportsbookId?: string;
}

export interface SgpResult {
  combinedOddsDecimal: number;
  /** Naive joint probability assuming all legs are independent (product of each leg's fair probability). */
  independenceFairProbability: number;
  /**
   * Independence probability scaled by a user-supplied correlation factor,
   * clamped so it never exceeds the single least-likely leg (a joint
   * probability can never exceed any individual leg's probability).
   */
  adjustedFairProbability: number;
  evPercent: number;
}

/** Combined decimal odds for a same-game parlay: the product of every leg's offered price. */
export function computeParlayOdds(legs: { oddsDecimal: number }[]): number {
  return legs.reduce((acc, leg) => acc * leg.oddsDecimal, 1);
}

/**
 * Estimates +EV for a same-game parlay. This is a SIMPLIFIED v1 heuristic,
 * NOT true correlation/copula modeling: positively-correlated legs (e.g.
 * "Team A wins" + "Team A -3.5") have a true joint probability higher than
 * the plain independence product, so callers should pass a `correlationFactor`
 * > 1 (an estimate, not derived from historical data) to approximate that.
 * Pass 1 to fall back to a pure independence assumption.
 */
export function computeSgpEv(legs: SgpLegInput[], correlationFactor: number, quotedOddsDecimal: number): SgpResult {
  if (legs.length < 2) {
    throw new Error("At least two legs are required to compute a parlay EV.");
  }
  if (!Number.isFinite(correlationFactor) || correlationFactor <= 0) {
    throw new Error("correlationFactor must be > 0.");
  }
  if (!Number.isFinite(quotedOddsDecimal) || quotedOddsDecimal <= 1) throw new Error("Enter the sportsbook's quoted parlay odds.");
  if (new Set(legs.map((leg) => leg.sportsbookId)).size > 1) throw new Error("Parlay legs must use the same sportsbook.");
  if (legs.some((leg) => !Number.isFinite(leg.fairProbability) || leg.fairProbability <= 0 || leg.fairProbability >= 1)) throw new Error("Invalid leg probability.");

  const combinedOddsDecimal = quotedOddsDecimal;
  const independenceFairProbability = legs.reduce(
    (acc, leg) => acc * leg.fairProbability,
    1
  );
  const minLegProbability = Math.min(...legs.map((leg) => leg.fairProbability));
  const adjustedFairProbability = Math.min(
    Math.max(independenceFairProbability * correlationFactor, Math.max(0, legs.reduce((sum, leg) => sum + leg.fairProbability, 0) - (legs.length - 1))),
    minLegProbability
  );
  const evPercent = (adjustedFairProbability * combinedOddsDecimal - 1) * 100;

  return {
    combinedOddsDecimal,
    independenceFairProbability,
    adjustedFairProbability,
    evPercent,
  };
}
