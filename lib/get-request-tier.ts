import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubscriptionTier } from "@/lib/types";

/**
 * Derives the real subscription tier for the current request server-side —
 * never trusts client input (previously a client-suppliable `tier` query
 * param always defaulted to "pro", silently granting every visitor
 * unlimited/undelayed access regardless of their actual subscription).
 * Signed-in users get their real `subscription_tier` from the DB. Anonymous
 * visitors get "free" (the real, honest free-tier preview) when Supabase is
 * configured, or "pro" when it isn't (local/mock dev with no credentials).
 */
export async function getRequestTier(): Promise<SubscriptionTier> {
  if (!isSupabaseConfigured()) return "pro";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const dbTier = profile?.subscription_tier;
  return dbTier === "pro" || dbTier === "plus" ? dbTier : "free";
}

const VALID_TIERS: SubscriptionTier[] = ["free", "plus", "pro"];

/**
 * Same as getRequestTier(), but honors the public "preview as Free/Plus/Pro"
 * toggle (see hooks/useTierPreview.ts) via an explicit `?tier=` query param
 * when present — an intentional, visible, no-login demo control, not a real
 * entitlement check. Used by every tier-gated API route for consistency.
 */
export async function getRequestTierWithOverride(request: NextRequest): Promise<SubscriptionTier> {
  const override = request.nextUrl.searchParams.get("tier");
  if (override && (VALID_TIERS as string[]).includes(override)) {
    return override as SubscriptionTier;
  }
  return getRequestTier();
}
