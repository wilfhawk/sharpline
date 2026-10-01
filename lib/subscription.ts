import type { EvOpportunity, SubscriptionTier } from "./types";

export interface TierLimits {
  dataDelayMinutes: number;
  maxOpportunitiesPerDay: number | null; // null = unlimited
}

// free: 15-min delayed, capped preview. plus/pro: real-time, unlimited +EV.
// plus vs pro is NOT about +EV data delay/volume — it's feature access (see
// hasProFeatures/canReceiveAlerts below): plus gets +EV alerts only, pro adds
// arbitrage/middles/SGP EV + their alerts on top.
const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { dataDelayMinutes: 15, maxOpportunitiesPerDay: 3 },
  plus: { dataDelayMinutes: 0, maxOpportunitiesPerDay: null },
  pro: { dataDelayMinutes: 0, maxOpportunitiesPerDay: null },
};

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

/** Arbitrage, middles, and SGP EV are Pro-only — Plus does not include them. */
export function hasProFeatures(tier: SubscriptionTier): boolean {
  return tier === "pro";
}

/** Plus and Pro can receive +EV opportunity alerts (see app/api/cron/alerts); Free cannot. */
export function canReceiveAlerts(tier: SubscriptionTier): boolean {
  return tier === "plus" || tier === "pro";
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
