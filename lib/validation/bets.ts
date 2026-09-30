import { z } from "zod";

export const logBetSchema = z.object({
  eventLabel: z.string().min(1),
  marketLabel: z.string().min(1),
  sportsbookName: z.string().min(1),
  oddsDecimal: z.number().gt(1),
  stake: z.number().gt(0),
  fairProbabilityAtBet: z.number().gt(0).lt(1),
});

export type LogBetValues = z.infer<typeof logBetSchema>;
