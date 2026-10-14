import { z } from "zod";

export const savedFilterSchema = z.object({
  name: z.string().min(1).max(60),
  filters: z.object({
    sport: z.string().optional(),
    sportsbookSlug: z.string().optional(),
    leagues: z.array(z.string().max(80)).max(60).optional(),
    sportsbookSlugs: z.array(z.string().max(80)).max(60).optional(),
    marketType: z.string().optional(),
    minEv: z.number().optional(),
    liveOnly: z.boolean().optional(),
    devigMethod: z.enum(["multiplicative", "power"]).optional(),
    modelAgrees: z.boolean().optional(),
  }),
});

export type SavedFilterValues = z.infer<typeof savedFilterSchema>;
