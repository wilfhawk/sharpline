"use client";

import { useQuery } from "@tanstack/react-query";
import { useTierPreview } from "./useTierPreview";
import type { CatalogGame } from "@/lib/game-catalog";
import type { SubscriptionTier } from "@/lib/types";

export interface CatalogResponse {
  games: CatalogGame[];
  meta: { tier: SubscriptionTier; isMock: boolean; capturedAt: string; warnings: string[] };
}

/** All games in the feed; shared by the All Games page and the header sports menu. */
export function useGameCatalog(options: { enabled?: boolean; refetchInterval?: number | false } = {}) {
  const { tierPreview } = useTierPreview();
  return useQuery<CatalogResponse>({
    queryKey: ["games", tierPreview],
    queryFn: async () => {
      const response = await fetch(`/api/games${tierPreview ? `?tier=${tierPreview}` : ""}`);
      if (!response.ok) throw new Error("Games are temporarily unavailable.");
      return response.json();
    },
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? false,
    staleTime: 60_000,
  });
}
