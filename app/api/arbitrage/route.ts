import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { computeArbitrageOpportunities } from "@/lib/arbitrage";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { hasProFeatures } from "@/lib/subscription";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

/** Arbitrage is a Pro-only feature — Free/Plus get an empty, gated response. */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await enforcePublicRateLimit(request, "arbitrage", 60);
  if (rateLimitResponse) return rateLimitResponse;

  const tier = await getRequestTierWithOverride(request);
  if (!hasProFeatures(tier)) {
    return NextResponse.json({
      opportunities: [],
      meta: { isMock: true, providerName: "gated", generatedAt: new Date().toISOString(), gated: true },
    });
  }

  const feed = await readFeed();
  const data = feed.data;
  const opportunities = computeArbitrageOpportunities(data);

  return NextResponse.json({
    opportunities,
    meta: {
      isMock: feed.isMock,
      providerName: feed.providerName,
      generatedAt: new Date().toISOString(),
      gated: false,
    },
  });
}
