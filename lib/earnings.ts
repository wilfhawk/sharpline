import { jStat } from "jstat";
import { z } from "zod";

export const earningsSchema = z.object({
  bankroll: z.number().finite().min(100).max(1_000_000),
  stakePercent: z.number().finite().min(0.1).max(5),
  betsPerMonth: z.number().int().min(1).max(1000),
  months: z.number().int().min(1).max(12),
  decimalOdds: z.number().finite().min(1.01).max(20),
  edgePercent: z.number().finite().min(-20).max(20),
  monthlyCost: z.number().finite().min(0).max(10_000),
}).refine((input) => (1 + input.edgePercent / 100) / input.decimalOdds < 1, { message: "The assumed edge is impossible at these odds." });

export type EarningsInputs = z.infer<typeof earningsSchema>;

function winQuantile(trials: number, probability: number, quantile: number): number {
  let low = 0;
  let high = trials;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (jStat.binomial.cdf(middle, trials, probability) >= quantile) high = middle;
    else low = middle + 1;
  }
  return low;
}

export function projectEarnings(values: EarningsInputs) {
  const input = earningsSchema.parse(values);
  const stake = input.bankroll * input.stakePercent / 100;
  const probability = (1 + input.edgePercent / 100) / input.decimalOdds;
  const timeline = Array.from({ length: input.months }, (_, index) => {
    const month = index + 1;
    const bets = input.betsPerMonth * month;
    const costs = input.monthlyCost * month;
    const profit = (wins: number) => wins * stake * input.decimalOdds - bets * stake - costs;
    const lower = profit(winQuantile(bets, probability, 0.025));
    const upper = profit(winQuantile(bets, probability, 0.975));
    const losingWins = Math.ceil((bets * stake + costs) / (stake * input.decimalOdds)) - 1;
    const lossProbability = losingWins < 0 ? 0 : losingWins >= bets ? 1 : jStat.binomial.cdf(losingWins, bets, probability);
    return { month, bets, costs, lower, upper, range: [lower, upper], expected: bets * stake * input.edgePercent / 100 - costs, lossProbability };
  });
  return { stake, winProbability: probability, timeline, final: timeline[timeline.length - 1], turnover: stake * input.betsPerMonth * input.months };
}