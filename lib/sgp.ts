/** One parlay leg's offered price and de-vigged fair probability (from an EvOpportunity). */
export interface SgpLegInput {
  id: string;
  label: string;
  oddsDecimal: number;
  fairProbability: number;
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
export function computeSgpEv(legs: SgpLegInput[], correlationFactor = 1): SgpResult {
  if (legs.length === 0) {
    throw new Error("At least one leg is required to compute a parlay EV.");
  }
  if (correlationFactor <= 0) {
    throw new Error("correlationFactor must be > 0.");
  }

  const combinedOddsDecimal = computeParlayOdds(legs);
  const independenceFairProbability = legs.reduce(
    (acc, leg) => acc * leg.fairProbability,
    1
  );
  const minLegProbability = Math.min(...legs.map((leg) => leg.fairProbability));
  const adjustedFairProbability = Math.min(
    independenceFairProbability * correlationFactor,
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
