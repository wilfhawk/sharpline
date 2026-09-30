"use client";

import { useQuery } from "@tanstack/react-query";
import type { ArbitrageOpportunity } from "@/lib/arbitrage";

interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    generatedAt: string;
  };
}

const POLL_INTERVAL_MS = 20_000;

async function fetchArbitrage(): Promise<ArbitrageResponse> {
  const res = await fetch("/api/arbitrage");
  if (!res.ok) {
    throw new Error(`Failed to load arbitrage opportunities: ${res.status}`);
  }
  return res.json();
}

/** Polls the cross-book arbitrage feed every 20s, matching the +EV feed's cadence. */
export function useArbitrage() {
  return useQuery({
    queryKey: ["arbitrage"],
    queryFn: fetchArbitrage,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
