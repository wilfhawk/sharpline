import type { EvOpportunity, SubscriptionTier } from "./types";

export interface TierLimits {
  dataDelayMinutes: number;
  maxOpportunitiesPerDay: number | null; // null = unlimited
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { dataDelayMinutes: 15, maxOpportunitiesPerDay: 3 },
  pro: { dataDelayMinutes: 0, maxOpportunitiesPerDay: null },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

/** Applies the free tier's 15-min delay + 3-per-day cap; pro tier passes through unchanged. */
export function applyTierGating(
  opportunities: EvOpportunity[],
  tier: SubscriptionTier
): EvOpportunity[] {
  const limits = getTierLimits(tier);
  let result = opportunities;

  if (limits.dataDelayMinutes > 0) {
    const cutoff = Date.now() - limits.dataDelayMinutes * 60 * 1000;
    result = result.filter(
      (o) => new Date(o.snapshotTimestamp).getTime() <= cutoff
    );
  }

  if (limits.maxOpportunitiesPerDay !== null) {
    result = result.slice(0, limits.maxOpportunitiesPerDay);
  }

  return result;
}
