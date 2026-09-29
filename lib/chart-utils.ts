export interface OddsHistoryPoint {
  label: string;
  oddsDecimal: number;
}

/**
 * Demo-only: derives a plausible-looking short price history ending at the
 * current odds via a small deterministic random walk (seeded by a string key
 * so the same market+book renders the same "history" within a session).
 * Mock mode has no real historical snapshots yet — see MockDataBanner.
 */
export function buildSyntheticOddsHistory(
  currentOddsDecimal: number,
  seedKey: string,
  points = 6
): OddsHistoryPoint[] {
  const random = mulberry32(hashString(seedKey));
  const history: number[] = [currentOddsDecimal];

  for (let i = 1; i < points; i++) {
    const previous = history[history.length - 1];
    const delta = (random() - 0.5) * 0.06;
    history.push(Math.max(1.01, previous + delta));
  }

  history.reverse();

  return history.map((oddsDecimal, index) => ({
    label: index === history.length - 1 ? "Now" : `-${(points - 1 - index) * 10}m`,
    oddsDecimal: Math.round(oddsDecimal * 1000) / 1000,
  }));
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
