export type BetResult = "win" | "loss" | "push" | "void";

export interface PerformanceBet {
  stake: number;
  odds_decimal: number;
  fair_probability_at_bet: number;
  placed_at: string;
  settled_at?: string | null;
  result?: BetResult | null;
  clv_percent: number | null;
}

export interface EquityPoint {
  index: number;
  date: string;
  actual: number;
  expected: number;
}

export interface PerformanceSummary {
  settledCount: number;
  openCount: number;
  staked: number;
  netProfit: number;
  expectedProfit: number;
  roiPercent: number | null;
  winRatePercent: number | null;
  averageClvPercent: number | null;
  equity: EquityPoint[];
}

export function betProfit(bet: Pick<PerformanceBet, "stake" | "odds_decimal" | "result">): number {
  if (bet.result === "win") return bet.stake * (bet.odds_decimal - 1);
  if (bet.result === "loss") return -bet.stake;
  return 0;
}

/** EV in dollars at the time the bet was placed, using the de-vigged fair probability. */
export function betExpectedProfit(bet: Pick<PerformanceBet, "stake" | "odds_decimal" | "fair_probability_at_bet">): number {
  return bet.stake * (bet.fair_probability_at_bet * bet.odds_decimal - 1);
}

export function summarizeBets(bets: PerformanceBet[]): PerformanceSummary {
  const settled = bets
    .filter((bet) => bet.result)
    .sort((a, b) => Date.parse(a.settled_at ?? a.placed_at) - Date.parse(b.settled_at ?? b.placed_at));

  let netProfit = 0;
  let expectedProfit = 0;
  let staked = 0;
  let decided = 0;
  let wins = 0;
  const equity: EquityPoint[] = settled.map((bet, index) => {
    const countsTowardResults = bet.result !== "void";
    netProfit += betProfit(bet);
    if (countsTowardResults) {
      // Pushes return the stake, so they carry no expected profit either.
      expectedProfit += bet.result === "push" ? 0 : betExpectedProfit(bet);
      staked += bet.result === "push" ? 0 : bet.stake;
    }
    if (bet.result === "win" || bet.result === "loss") {
      decided += 1;
      if (bet.result === "win") wins += 1;
    }
    return { index: index + 1, date: bet.settled_at ?? bet.placed_at, actual: round(netProfit), expected: round(expectedProfit) };
  });

  const clvValues = bets.map((bet) => bet.clv_percent).filter((value): value is number => value !== null);
  return {
    settledCount: settled.length,
    openCount: bets.length - settled.length,
    staked: round(staked),
    netProfit: round(netProfit),
    expectedProfit: round(expectedProfit),
    roiPercent: staked > 0 ? (netProfit / staked) * 100 : null,
    winRatePercent: decided > 0 ? (wins / decided) * 100 : null,
    averageClvPercent: clvValues.length > 0 ? clvValues.reduce((sum, value) => sum + value, 0) / clvValues.length : null,
    equity,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
