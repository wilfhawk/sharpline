/**
 * Kelly Criterion stake sizing. Fractional Kelly (a configurable multiplier of
 * full Kelly, e.g. 0.25 = "quarter Kelly") is used industry-wide to reduce
 * variance versus full Kelly, which is mathematically optimal but very volatile.
 */

/** Full Kelly fraction of bankroll to stake, given fair (de-vigged) win probability and decimal odds. Clamped to >= 0 (no edge = no stake). */
export function kellyFraction(fairProbability: number, oddsDecimal: number): number {
  if (fairProbability <= 0 || fairProbability >= 1) {
    throw new Error(`Invalid fairProbability: ${fairProbability}. Must be between 0 and 1.`);
  }
  if (oddsDecimal <= 1) {
    throw new Error(`Invalid oddsDecimal: ${oddsDecimal}. Must be > 1.`);
  }

  const b = oddsDecimal - 1; // net odds (profit per unit staked)
  const q = 1 - fairProbability;
  const fraction = (b * fairProbability - q) / b;
  return Math.max(0, fraction);
}

export type KellyMultiplier = 0.25 | 0.5 | 1;

/** Recommended dollar stake = bankroll x fractional Kelly. Rounded to the nearest cent. */
export function recommendedStake(
  bankroll: number,
  fairProbability: number,
  oddsDecimal: number,
  kellyMultiplier: KellyMultiplier = 0.25
): number {
  if (bankroll <= 0) return 0;
  const stake = bankroll * kellyFraction(fairProbability, oddsDecimal) * kellyMultiplier;
  return Math.round(stake * 100) / 100;
}
