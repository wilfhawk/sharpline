/** Two-way de-vigged fair probabilities for the "A" and "B" sides of a market. */
export interface FairProbabilities {
  fairProbabilityA: number;
  fairProbabilityB: number;
}

export type DevigMethod = "multiplicative" | "power";

/** A ranked/filterable EV result — only `evPercent` (e.g. 5.2 for 5.2%) is required. */
export type EvCandidate = { id: string; evPercent: number };

function validateDecimalOdds(oddsA: number, oddsB: number): void {
  if (oddsA <= 1 || oddsB <= 1) {
    throw new Error(
      `Invalid decimal odds: ${oddsA}, ${oddsB}. Both must be > 1.`
    );
  }
}

/** De-vig via the proportional (multiplicative) method: split the overround pro-rata. */
export function devigMultiplicative(
  oddsA: number,
  oddsB: number
): FairProbabilities {
  validateDecimalOdds(oddsA, oddsB);
  const rawA = 1 / oddsA;
  const rawB = 1 / oddsB;
  const overround = rawA + rawB;
  return {
    fairProbabilityA: rawA / overround,
    fairProbabilityB: rawB / overround,
  };
}

/**
 * De-vig via the power method: find exponent k >= 1 such that
 * rawA^k + rawB^k = 1, via bisection (monotonically decreasing in k).
 */
export function devigPower(oddsA: number, oddsB: number): FairProbabilities {
  validateDecimalOdds(oddsA, oddsB);
  const rawA = 1 / oddsA;
  const rawB = 1 / oddsB;

  let lo = 1;
  let hi = 64;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const sum = rawA ** mid + rawB ** mid;
    if (sum > 1) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  const k = (lo + hi) / 2;
  return { fairProbabilityA: rawA ** k, fairProbabilityB: rawB ** k };
}

export function calculateFairProbabilities(
  oddsA: number,
  oddsB: number,
  method: DevigMethod = "multiplicative"
): FairProbabilities {
  return method === "power"
    ? devigPower(oddsA, oddsB)
    : devigMultiplicative(oddsA, oddsB);
}

/** EV as a fraction (0.05 = 5%) given a Pinnacle-derived fair probability and a book's decimal odds. */
export function computeEV(fairProbability: number, decimalOdds: number): number {
  return fairProbability * decimalOdds - 1;
}

/** Filter to EV% >= minThresholdPercent (default 2%) and sort descending by EV%. */
export function findPositiveEV<T extends { evPercent: number }>(
  candidates: T[],
  minThresholdPercent = 2
): T[] {
  return candidates
    .filter((c) => c.evPercent >= minThresholdPercent)
    .sort((a, b) => b.evPercent - a.evPercent);
}
