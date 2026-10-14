import { AppHeader } from "@/components/layout/AppHeader";
import { PlansPage } from "@/components/marketing/PlansPage";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubscriptionTier } from "@/lib/types";

export const metadata = {
  title: "Plans and pricing | SharpLine",
  description: "Compare the Free, Plus and Pro plans and see exactly which features each one includes.",
};

export default async function PricingPage() {
  let signedIn = false;
  let tier: SubscriptionTier = "free";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      signedIn = true;
      const { data: profile } = await supabase.from("users").select("subscription_tier").eq("id", user.id).single();
      tier = (profile?.subscription_tier as SubscriptionTier | undefined) ?? "free";
    }
  }
  return <><AppHeader /><PlansPage signedIn={signedIn} currentTier={tier} /></>;
}
