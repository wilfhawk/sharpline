"use client";

import { useQuery } from "@tanstack/react-query";
import type { MiddleOpportunity } from "@/lib/middles";

interface MiddlesResponse {
  opportunities: MiddleOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    generatedAt: string;
  };
}

const POLL_INTERVAL_MS = 20_000;

async function fetchMiddles(): Promise<MiddlesResponse> {
  const res = await fetch("/api/middles");
  if (!res.ok) {
    throw new Error(`Failed to load middle opportunities: ${res.status}`);
  }
  return res.json();
}

/** Polls the middles feed every 20s, matching the +EV/arbitrage feeds' cadence. */
export function useMiddles() {
  return useQuery({
    queryKey: ["middles"],
    queryFn: fetchMiddles,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
