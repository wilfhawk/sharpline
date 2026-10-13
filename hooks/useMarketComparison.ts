"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookComparisonRow } from "@/lib/types";
import { useTierPreview } from "./useTierPreview";

async function fetchMarketComparison(marketId: string, tier: string | null, method: string): Promise<BookComparisonRow[]> {
  const params = new URLSearchParams({ devigMethod: method });
  if (tier) params.set("tier", tier);
  const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/comparison?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to load market comparison: ${res.status}`);
  }
  const body = await res.json();
  return body.rows;
}

/** Fetches every tracked book's price for one market — lazy, only when a row is expanded. */
export function useMarketComparison(marketId: string, enabled: boolean, method = "multiplicative") {
  const { tierPreview } = useTierPreview();
  return useQuery({
    queryKey: ["market-comparison", marketId, tierPreview, method],
    queryFn: () => fetchMarketComparison(marketId, tierPreview, method),
    enabled,
  });
}
