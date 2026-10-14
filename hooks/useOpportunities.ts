"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DevigMethod, EvOpportunity, SubscriptionTier } from "@/lib/types";
import { hasLiveOpportunities } from "@/lib/live";
import { useTierPreview } from "./useTierPreview";

export interface OpportunityFilters {
  sport?: string;
  sportsbookSlug?: string;
  /** Leagues to include (e.g. "NFL"); empty or unset means all. */
  leagues?: string[];
  /** Sportsbook slugs to include; empty or unset means all. */
  sportsbookSlugs?: string[];
  marketType?: string;
  minEv?: number;
  liveOnly?: boolean;
  /** Pro-only: which de-vig model computes fair odds (server ignores this for Free/Plus). */
  devigMethod?: DevigMethod;
  /** Pro-only: only show opportunities where the model also sees +EV. */
  modelAgrees?: boolean;
}

interface OpportunitiesResponse {
  opportunities: EvOpportunity[];
  facets: { sports: string[]; leagues: string[]; sportsbooks: { slug: string; name: string }[]; marketTypes: string[] };
  meta: {
    isMock: boolean;
    providerName: string;
    tier: SubscriptionTier;
    modelVersion: string | null;
    generatedAt: string;
    capturedAt: string;
    warnings: string[];
  };
}

const POLL_INTERVAL_MS = 20_000;
/** Faster poll cadence when live/in-play events are present — lines move fastest once a game starts. */
const LIVE_POLL_INTERVAL_MS = 8_000;

function buildQueryString(filters: OpportunityFilters, tierPreview: SubscriptionTier | null): string {
  const params = new URLSearchParams();
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.sportsbookSlug) params.set("sportsbook", filters.sportsbookSlug);
  if (filters.leagues?.length) params.set("leagues", filters.leagues.join(","));
  if (filters.sportsbookSlugs?.length) params.set("sportsbooks", filters.sportsbookSlugs.join(","));
  if (filters.marketType) params.set("marketType", filters.marketType);
  if (filters.minEv !== undefined) params.set("minEv", String(filters.minEv));
  if (filters.liveOnly) params.set("liveOnly", "true");
  if (filters.devigMethod) params.set("devigMethod", filters.devigMethod);
  if (filters.modelAgrees) params.set("modelAgrees", "true");
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
export function useOpportunities(filters: OpportunityFilters = {}, options: { enabled?: boolean } = {}) {
  const { tierPreview } = useTierPreview();
  return useQuery({
    queryKey: ["opportunities", filters, tierPreview],
    queryFn: () => fetchOpportunities(filters, tierPreview),
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const opportunities = query.state.data?.opportunities ?? [];
      return hasLiveOpportunities(opportunities) ? LIVE_POLL_INTERVAL_MS : POLL_INTERVAL_MS;
    },
  });
}
