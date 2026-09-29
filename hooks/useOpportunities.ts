"use client";

import { useQuery } from "@tanstack/react-query";
import type { EvOpportunity } from "@/lib/types";

export interface OpportunityFilters {
  sport?: string;
  sportsbookSlug?: string;
  marketType?: string;
  minEv?: number;
}

interface OpportunitiesResponse {
  opportunities: EvOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    tier: "free" | "pro";
    generatedAt: string;
  };
}

const POLL_INTERVAL_MS = 20_000;

function buildQueryString(filters: OpportunityFilters): string {
  const params = new URLSearchParams();
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.sportsbookSlug) params.set("sportsbook", filters.sportsbookSlug);
  if (filters.marketType) params.set("marketType", filters.marketType);
  if (filters.minEv !== undefined) params.set("minEv", String(filters.minEv));
  return params.toString();
}

async function fetchOpportunities(
  filters: OpportunityFilters
): Promise<OpportunitiesResponse> {
  const query = buildQueryString(filters);
  const res = await fetch(`/api/opportunities${query ? `?${query}` : ""}`);
  if (!res.ok) {
    throw new Error(`Failed to load opportunities: ${res.status}`);
  }
  return res.json();
}

/** Polls the +EV opportunities feed every 20s, re-fetching whenever filters change. */
export function useOpportunities(filters: OpportunityFilters = {}) {
  return useQuery({
    queryKey: ["opportunities", filters],
    queryFn: () => fetchOpportunities(filters),
    refetchInterval: POLL_INTERVAL_MS,
  });
}
