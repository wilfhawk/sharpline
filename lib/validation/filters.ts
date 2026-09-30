import { z } from "zod";

export const savedFilterSchema = z.object({
  name: z.string().min(1).max(60),
  filters: z.object({
    sport: z.string().optional(),
    sportsbookSlug: z.string().optional(),
    marketType: z.string().optional(),
    minEv: z.number().optional(),
  }),
});

export type SavedFilterValues = z.infer<typeof savedFilterSchema>;
