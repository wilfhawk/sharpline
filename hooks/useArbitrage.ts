"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArbitrageOpportunity } from "@/lib/arbitrage";
import { useTierPreview } from "./useTierPreview";

interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    generatedAt: string;
    gated?: boolean;
  };
}

const POLL_INTERVAL_MS = 20_000;

async function fetchArbitrage(tierPreview: "free" | "plus" | "pro" | null): Promise<ArbitrageResponse> {
  const query = tierPreview ? `?tier=${tierPreview}` : "";
  const res = await fetch(`/api/arbitrage${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load arbitrage opportunities: ${res.status}`);
  }
  return res.json();
}

/** Polls the cross-book arbitrage feed every 20s, matching the +EV feed's cadence. */
export function useArbitrage() {
  const { tierPreview } = useTierPreview();
  return useQuery({
    queryKey: ["arbitrage", tierPreview],
    queryFn: () => fetchArbitrage(tierPreview),
    refetchInterval: POLL_INTERVAL_MS,
  });
}
