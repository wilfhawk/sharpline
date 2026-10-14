import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { readFeed } from "@/lib/feed";
import { computeAllOpportunities } from "@/lib/opportunities";
import { attachPredictions } from "@/lib/predictions";
import { explainPrediction, type Explanation, type ExplanationSource } from "@/lib/prediction-explainer";
import { hasProFeatures } from "@/lib/subscription";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";
import { formatAmericanOdds } from "@/lib/display";

const bodySchema = z.object({
  opportunityId: z.string().min(1).max(200),
  devigMethod: z.enum(["multiplicative", "power"]).optional(),
});

const CACHE_TTL_MS = 15 * 60_000;
const CACHE_MAX = 200;
const cache = new Map<string, { expires: number; value: { explanation: Explanation; source: ExplanationSource; reason?: string } }>();

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await enforcePublicRateLimit(request, "predictions-explain", 20);
    if (rateLimitResponse) return rateLimitResponse;

    const tier = await getRequestTierWithOverride(request);
    if (!hasProFeatures(tier)) {
      return NextResponse.json({ error: "Model explanations are a Pro feature." }, { status: 403 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const { opportunityId, devigMethod = "multiplicative" } = parsed.data;

    const feed = await readFeed();
    const predicted = attachPredictions(feed.data, computeAllOpportunities(feed.data, devigMethod), devigMethod);
    const opportunity = predicted.find((o) => o.id === opportunityId);
    if (!opportunity) return NextResponse.json({ error: "Opportunity is no longer available." }, { status: 404 });

    const { prediction } = opportunity;
    const cacheKey = [
      opportunity.id,
      prediction.modelVersion,
      devigMethod,
      Math.round(prediction.modelProbability * 200),
      Math.round(opportunity.oddsDecimal * 100),
    ].join(":");
    const hit = cache.get(cacheKey);
    if (hit && hit.expires > Date.now()) return NextResponse.json({ ...hit.value, cached: true });

    const result = await explainPrediction({
      eventLabel: `${opportunity.event.awayTeam} @ ${opportunity.event.homeTeam}`,
      sport: opportunity.event.sport,
      sideLabel: opportunity.sideLabel,
      marketType: opportunity.market.marketType,
      sportsbook: opportunity.sportsbook.name,
      americanOdds: formatAmericanOdds(opportunity.oddsDecimal),
      referenceBook: opportunity.referenceBook ?? "sharp reference",
      referenceProbability: prediction.features.referenceProbability,
      modelProbability: prediction.modelProbability,
      marketEvPercent: opportunity.evPercent,
      modelEdgePercent: prediction.modelEdgePercent,
      confidence: prediction.confidence,
      bookCount: prediction.features.bookCount,
      consensusProbability: prediction.features.consensusProbability,
      dispersion: prediction.features.dispersion,
      hoursToStart: prediction.features.hoursToStart,
    });

    if (result.source === "gemini") {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
      cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, value: result });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("prediction_explain_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Explanation temporarily unavailable." }, { status: 503 });
  }
}
