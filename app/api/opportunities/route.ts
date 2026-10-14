import { NextResponse, type NextRequest } from "next/server";
import { readFeed, dailyPreview } from "@/lib/feed";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";
import { filterLiveOnly } from "@/lib/live";
import { hasProFeatures } from "@/lib/subscription";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";
import { attachPredictions, shapeForTier, MODEL_VERSION } from "@/lib/predictions";
import { parseListParam } from "@/lib/dashboard-profile";
import type { DevigMethod } from "@/lib/types";

function parseDevigMethod(value: string | null): DevigMethod {
  return value === "power" ? "power" : "multiplicative";
}

export async function GET(request: NextRequest) {
  try {
  const rateLimitResponse = await enforcePublicRateLimit(request, "opportunities", 120);
  if (rateLimitResponse) return rateLimitResponse;

  const params = request.nextUrl.searchParams;
  const sport = params.get("sport");
  const sportsbookSlug = params.get("sportsbook");
  const marketType = params.get("marketType");
  const minEvPercent = Number(params.get("minEv") ?? 2);
  if (!Number.isFinite(minEvPercent) || minEvPercent < 0 || minEvPercent > 100) {
    return NextResponse.json({ error: "Invalid EV threshold." }, { status: 400 });
  }
  const liveOnly = params.get("liveOnly") === "true";
  const tier = await getRequestTierWithOverride(request);
  // Devig model selection is a Pro feature — Free/Plus are always computed multiplicative.
  const devigMethod = hasProFeatures(tier) ? parseDevigMethod(params.get("devigMethod")) : "multiplicative";

  const feed = await readFeed(tier === "free");
  const data = feed.data;

  let opportunities = tier === "free" ? await dailyPreview(feed) : computeAllOpportunities(data, devigMethod);

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
  const leagues = parseListParam(params.get("leagues"));
  if (leagues) {
    opportunities = opportunities.filter((o) => leagues.includes(o.event.league));
  }
  const sportsbookSlugs = parseListParam(params.get("sportsbooks"));
  if (sportsbookSlugs) {
    opportunities = opportunities.filter((o) => sportsbookSlugs.includes(o.sportsbook.slug));
  }
  if (liveOnly) {
    opportunities = filterLiveOnly(opportunities);
  }

  opportunities = findPositiveEV(opportunities, minEvPercent);

  if (tier !== "free") {
    let predicted = attachPredictions(data, opportunities, devigMethod);
    // Model-agreement filtering is Pro-only; Plus only sees the badge.
    if (hasProFeatures(tier) && params.get("modelAgrees") === "true") {
      predicted = predicted.filter((o) => o.prediction.agreement === "agrees");
    }
    opportunities = shapeForTier(predicted, tier);
  }

  return NextResponse.json({
    opportunities,
    facets: {
      sports: [...new Set(data.events.map((event) => event.sport))].sort(),
      leagues: [...new Set(data.events.map((event) => event.league))].sort(),
      sportsbooks: data.sportsbooks.filter((book) => !book.isSharpReference).map((book) => ({ slug: book.slug, name: book.name })),
      marketTypes: [...new Set(data.markets.map((market) => market.marketType))].sort(),
    },
    meta: {
      isMock: feed.isMock,
      providerName: feed.providerName,
      tier,
      modelVersion: tier === "free" ? null : MODEL_VERSION,
      generatedAt: new Date().toISOString(),
      capturedAt: feed.capturedAt,
      warnings: feed.warnings,
    },
  });
  } catch (error) {
    console.error("opportunities_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Odds are temporarily unavailable. Please retry shortly." }, { status: 503 });
  }
}
