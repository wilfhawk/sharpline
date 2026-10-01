import { NextResponse, type NextRequest } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";
import { filterLiveOnly } from "@/lib/live";
import { applyTierGating } from "@/lib/subscription";
import { getRequestTier } from "@/lib/get-request-tier";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sport = params.get("sport");
  const sportsbookSlug = params.get("sportsbook");
  const marketType = params.get("marketType");
  const minEvPercent = Number(params.get("minEv") ?? 2);
  const liveOnly = params.get("liveOnly") === "true";
  // Public "preview as Free/Pro" toggle (see hooks/useTierPreview.ts) — an
  // intentional, visible, no-login demo control, not a real entitlement
  // check. Falls back to the viewer's real subscription tier when unset.
  const tierOverride = params.get("tier");
  const tier =
    tierOverride === "free" || tierOverride === "pro"
      ? tierOverride
      : await getRequestTier();

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
    },
  });
}
