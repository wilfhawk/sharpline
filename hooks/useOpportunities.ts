"use client";

import { useQuery } from "@tanstack/react-query";
import type { EvOpportunity, SubscriptionTier } from "@/lib/types";
import { hasLiveOpportunities } from "@/lib/live";
import { useTierPreview } from "./useTierPreview";

export interface OpportunityFilters {
  sport?: string;
  sportsbookSlug?: string;
  marketType?: string;
  minEv?: number;
  liveOnly?: boolean;
}

interface OpportunitiesResponse {
  opportunities: EvOpportunity[];
  meta: {
    isMock: boolean;
    providerName: string;
    tier: SubscriptionTier;
    generatedAt: string;
  };
}

const POLL_INTERVAL_MS = 20_000;
/** Faster poll cadence when live/in-play events are present — lines move fastest once a game starts. */
const LIVE_POLL_INTERVAL_MS = 8_000;

function buildQueryString(filters: OpportunityFilters, tierPreview: SubscriptionTier | null): string {
  const params = new URLSearchParams();
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.sportsbookSlug) params.set("sportsbook", filters.sportsbookSlug);
  if (filters.marketType) params.set("marketType", filters.marketType);
  if (filters.minEv !== undefined) params.set("minEv", String(filters.minEv));
  if (filters.liveOnly) params.set("liveOnly", "true");
  if (tierPreview) params.set("tier", tierPreview);
  return params.toString();
}

async function fetchOpportunities(
  filters: OpportunityFilters,
  tierPreview: SubscriptionTier | null
): Promise<OpportunitiesResponse> {
  const query = buildQueryString(filters, tierPreview);
  const res = await fetch(`/api/opportunities${query ? `?${query}` : ""}`);
  if (!res.ok) {
    throw new Error(`Failed to load opportunities: ${res.status}`);
  }
  return res.json();
}

/**
 * Polls the +EV opportunities feed every 20s (8s whenever a live/in-play
 * opportunity is present, since in-play lines move fastest), re-fetching
 * whenever filters change. Honors the public "preview as Free/Pro" toggle
 * (see useTierPreview) — falls back to the viewer's real tier when unset.
 */
export function useOpportunities(filters: OpportunityFilters = {}) {
  const { tierPreview } = useTierPreview();
  return useQuery({
    queryKey: ["opportunities", filters, tierPreview],
    queryFn: () => fetchOpportunities(filters, tierPreview),
    refetchInterval: (query) => {
      const opportunities = query.state.data?.opportunities ?? [];
      return hasLiveOpportunities(opportunities) ? LIVE_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
    },
  });
}
