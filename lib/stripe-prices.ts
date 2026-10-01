import type { SubscriptionTier } from "@/lib/types";

export type BillingInterval = "month" | "year";
export type PaidTier = Exclude<SubscriptionTier, "free">;

/** Env var name holding each paid tier/interval combination's Stripe Price ID. */
const PRICE_ENV_VARS: Record<PaidTier, Record<BillingInterval, string>> = {
  plus: {
    month: "NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY",
    year: "NEXT_PUBLIC_STRIPE_PRICE_PLUS_ANNUAL",
  },
  pro: {
    month: "NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY",
    year: "NEXT_PUBLIC_STRIPE_PRICE_PRO_ANNUAL",
  },
};

/** Looks up the configured Stripe Price ID for a given paid tier + billing interval. */
export function getPriceId(tier: PaidTier, interval: BillingInterval): string | undefined {
  return process.env[PRICE_ENV_VARS[tier][interval]];
}

/** Reverse lookup: which (tier, interval) a Stripe Price ID corresponds to, for the webhook. */
export function getTierForPriceId(priceId: string): { tier: PaidTier; interval: BillingInterval } | null {
  for (const tier of ["plus", "pro"] as PaidTier[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (getPriceId(tier, interval) === priceId) {
        return { tier, interval };
      }
    }
  }
  return null;
}
