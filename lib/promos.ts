import { z } from "zod";

/** All odds here are decimal; the UI converts from American. */
const decimalOdds = z.number().finite().gt(1).max(1000);
const amount = z.number().finite().gt(0).max(10_000_000);

export const bonusBetSchema = z.object({ bonus: amount, bonusOdds: decimalOdds, hedgeOdds: decimalOdds });
export const profitBoostSchema = z.object({
  stake: amount,
  odds: decimalOdds,
  boostPercent: z.number().finite().min(0).max(500),
  fairProbability: z.number().finite().gt(0).lt(1),
  hedgeOdds: decimalOdds.nullable(),
});
export const riskFreeSchema = z.object({
  stake: amount,
  odds: decimalOdds,
  hedgeOdds: decimalOdds,
  refundCap: amount,
  conversionRate: z.number().finite().min(0).max(1),
});
export const depositMatchSchema = z.object({
  deposit: amount,
  matchPercent: z.number().finite().min(0).max(1000),
  maxBonus: amount,
  playthrough: z.number().finite().min(0).max(100),
  basis: z.enum(["bonus", "deposit_plus_bonus"]),
  holdPercent: z.number().finite().min(0).max(30),
});

export type BonusBetInput = z.infer<typeof bonusBetSchema>;
export type ProfitBoostInput = z.infer<typeof profitBoostSchema>;
export type RiskFreeInput = z.infer<typeof riskFreeSchema>;
export type DepositMatchInput = z.infer<typeof depositMatchSchema>;

/**
 * A bonus bet pays only the winnings (the stake is not returned). Hedging the
 * other side at a second book with H = B(Ob-1)/Oh locks the same profit either way.
 */
export function convertBonusBet(input: BonusBetInput) {
  const { bonus, bonusOdds, hedgeOdds } = bonusBetSchema.parse(input);
  const hedgeStake = (bonus * (bonusOdds - 1)) / hedgeOdds;
  const profit = hedgeStake * (hedgeOdds - 1);
  return { hedgeStake, profit, conversionPercent: (profit / bonus) * 100 };
}

/** EV of a boosted price against the fair probability, plus the locked-in result if hedged. */
export function evaluateProfitBoost(input: ProfitBoostInput) {
  const { stake, odds, boostPercent, fairProbability, hedgeOdds } = profitBoostSchema.parse(input);
  const boostedOdds = 1 + (odds - 1) * (1 + boostPercent / 100);
  const evDollars = stake * (fairProbability * boostedOdds - 1);
  const hedgeStake = hedgeOdds === null ? null : (stake * boostedOdds) / hedgeOdds;
  const lockedProfit = hedgeStake === null ? null : stake * boostedOdds - stake - hedgeStake;
  return { boostedOdds, evDollars, evPercent: (evDollars / stake) * 100, hedgeStake, lockedProfit };
}

/**
 * First-bet insurance: a losing bet is refunded (up to a cap) as a bonus bet that
 * is worth `conversionRate` of its face value once converted. The hedge is sized so
 * the profit is identical whichever side wins.
 */
export function evaluateRiskFree(input: RiskFreeInput) {
  const { stake, odds, hedgeOdds, refundCap, conversionRate } = riskFreeSchema.parse(input);
  const refund = Math.min(stake, refundCap);
  const hedgeStake = (stake * odds - conversionRate * refund) / hedgeOdds;
  const profit = stake * (odds - 1) - hedgeStake;
  return { refund, hedgeStake, profit };
}

/** Bonus value minus the expected house edge paid while meeting the playthrough. */
export function evaluateDepositMatch(input: DepositMatchInput) {
  const { deposit, matchPercent, maxBonus, playthrough, basis, holdPercent } = depositMatchSchema.parse(input);
  const bonus = Math.min((deposit * matchPercent) / 100, maxBonus);
  const wageringRequired = playthrough * (basis === "bonus" ? bonus : deposit + bonus);
  const expectedCost = (wageringRequired * holdPercent) / 100;
  return { bonus, wageringRequired, expectedCost, expectedValue: bonus - expectedCost };
}
