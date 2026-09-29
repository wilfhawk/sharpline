/** Convert American odds (e.g. +150, -110) to decimal odds (e.g. 2.5, 1.909091). */
export function americanToDecimal(american: number): number {
  if (american > -100 && american < 100) {
    throw new Error(
      `Invalid American odds: ${american}. Must be <= -100 or >= 100.`
    );
  }
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

/** Convert decimal odds (must be > 1) back to American odds. */
export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) {
    throw new Error(`Invalid decimal odds: ${decimal}. Must be > 1.`);
  }
  return decimal >= 2 ? (decimal - 1) * 100 : -100 / (decimal - 1);
}
