import { NextResponse, type NextRequest } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";
import { applyTierGating } from "@/lib/subscription";
import type { SubscriptionTier } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sport = params.get("sport");
  const sportsbookSlug = params.get("sportsbook");
  const marketType = params.get("marketType");
  const minEvPercent = Number(params.get("minEv") ?? 2);
  // TODO(Phase 5): derive tier from the authenticated user's subscription_tier
  // instead of a query param, once Stripe/Supabase subscription gating lands.
  const tier: SubscriptionTier = params.get("tier") === "pro" ? "pro" : "free";

  const provider = getOddsProvider();
  const data = await provider.fetchData();

  let opportunities = computeAllOpportunities(data);

  if (sport) {
    opportunities = opportunities.filter((o) => o.event.sport === sport);
  }
  if (sportsbookSlug) {
    opportunities = opportunities.filter(
      (o) => o.sportsbook.slug === sportsbookSlug
    );
  }
  if (marketType) {
    opportunities = opportunities.filter(
      (o) => o.market.marketType === marketType
    );
  }

  opportunities = findPositiveEV(opportunities, minEvPercent);
  opportunities = applyTierGating(opportunities, tier);

  return NextResponse.json({
    opportunities,
    meta: {
      isMock: provider.isMock,
      providerName: provider.name,
      tier,
      generatedAt: new Date().toISOString(),
    },
  });
}
