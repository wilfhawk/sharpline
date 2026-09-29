"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookComparisonRow } from "@/lib/types";

async function fetchMarketComparison(marketId: string): Promise<BookComparisonRow[]> {
  const res = await fetch(`/api/markets/${marketId}/comparison`);
  if (!res.ok) {
    throw new Error(`Failed to load market comparison: ${res.status}`);
  }
  const body = await res.json();
  return body.rows;
}

/** Fetches every tracked book's price for one market — lazy, only when a row is expanded. */
export function useMarketComparison(marketId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["market-comparison", marketId],
    queryFn: () => fetchMarketComparison(marketId),
    enabled,
  });
}
