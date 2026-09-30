/**
 * Closing Line Value (CLV): how the odds a bettor took compare to the
 * Pinnacle-derived fair price once the market "closed" (settled by game time
 * or the latest available snapshot). Widely considered the single best
 * predictor of long-run sports betting profitability.
 */

/**
 * CLV% > 0 means the bettor beat the closing line (got better value than the
 * market's final fair price); CLV% < 0 means the line moved against them.
 */
export function computeClv(oddsTaken: number, closingFairProbability: number): number {
  if (oddsTaken <= 1) {
    throw new Error(`Invalid oddsTaken: ${oddsTaken}. Must be > 1.`);
  }
  if (closingFairProbability <= 0 || closingFairProbability >= 1) {
    throw new Error(
      `Invalid closingFairProbability: ${closingFairProbability}. Must be between 0 and 1.`
    );
  }

  const closingFairOdds = 1 / closingFairProbability;
  return (oddsTaken / closingFairOdds - 1) * 100;
}
