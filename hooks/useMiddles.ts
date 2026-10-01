"use client";

import { useQuery } from "@tanstack/react-query";
import type { MiddleOpportunity } from "@/lib/middles";
import { useTierPreview } from "./useTierPreview";

interface MiddlesResponse {
  opportunities: MiddleOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    generatedAt: string;
    gated?: boolean;
  };
}

const POLL_INTERVAL_MS = 20_000;

async function fetchMiddles(tierPreview: "free" | "plus" | "pro" | null): Promise<MiddlesResponse> {
  const query = tierPreview ? `?tier=${tierPreview}` : "";
  const res = await fetch(`/api/middles${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load middle opportunities: ${res.status}`);
  }
  return res.json();
}

/** Polls the middles feed every 20s, matching the +EV/arbitrage feeds' cadence. */
export function useMiddles() {
  const { tierPreview } = useTierPreview();
  return useQuery({
    queryKey: ["middles", tierPreview],
    queryFn: () => fetchMiddles(tierPreview),
    refetchInterval: POLL_INTERVAL_MS,
  });
}
