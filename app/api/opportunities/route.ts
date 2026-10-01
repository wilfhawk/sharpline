import { NextResponse, type NextRequest } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";
import { filterLiveOnly } from "@/lib/live";
import { applyTierGating } from "@/lib/subscription";
import type { SubscriptionTier } from "@/lib/types";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sport = params.get("sport");
  const sportsbookSlug = params.get("sportsbook");
  const marketType = params.get("marketType");
  const minEvPercent = Number(params.get("minEv") ?? 2);
  const liveOnly = params.get("liveOnly") === "true";
  const debug = params.get("debug") === "true";
  // TODO(Phase 5): derive tier from the authenticated user's subscription_tier
  // instead of a query param, once Stripe/Supabase subscription gating lands.
  // Defaults to "pro" (ungated) since there's no real auth/subscription yet.
  const tier: SubscriptionTier = params.get("tier") === "free" ? "free" : "pro";

  const provider = getOddsProvider();
  const data = await provider.fetchData();

  let opportunities = computeAllOpportunities(data);
  const rawOpportunityCount = opportunities.length;
  const maxEvPercent = opportunities.length
    ? Math.max(...opportunities.map((o) => o.evPercent))
    : null;

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
  if (liveOnly) {
    opportunities = filterLiveOnly(opportunities);
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
      ...(debug
        ? {
            debugEventCount: data.events.length,
            debugSportsbookKeys: data.sportsbooks.map((s) => s.slug),
            debugSharpSportsbookKeys: data.sportsbooks
              .filter((s) => s.isSharpReference)
              .map((s) => s.slug),
            debugMarketCount: data.markets.length,
            debugRawOpportunityCount: rawOpportunityCount,
            debugMaxEvPercentBeforeThreshold: maxEvPercent,
            debugMinEvThreshold: minEvPercent,
            debugConfigRegions: process.env.ODDS_API_REGIONS ?? "us,eu",
            debugConfigSports: process.env.ODDS_API_SPORTS ?? "americanfootball_nfl,basketball_nba",
            debugConfigSharpBooks: process.env.ODDS_API_SHARP_BOOKS ?? "pinnacle",
          }
        : {}),
    },
  });
}
