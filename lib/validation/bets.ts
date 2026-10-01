import { z } from "zod";

export const logBetSchema = z.object({
  eventLabel: z.string().min(1),
  marketLabel: z.string().min(1),
  sportsbookName: z.string().min(1),
  oddsDecimal: z.number().gt(1),
  stake: z.number().gt(0),
  fairProbabilityAtBet: z.number().gt(0).lt(1),
  // Optional: lets the closing-line capture cron re-find this exact market
  // later. Omitted for bets logged outside the normal opportunity flow.
  marketId: z.string().optional(),
  sportsbookSlug: z.string().optional(),
  side: z.enum(["A", "B"]).optional(),
  eventStartTime: z.string().optional(),
});

export type LogBetValues = z.infer<typeof logBetSchema>;
