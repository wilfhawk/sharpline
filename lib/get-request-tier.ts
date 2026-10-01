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

  return profile?.subscription_tier === "pro" ? "pro" : "free";
}
