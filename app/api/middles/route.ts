import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { computeMiddleOpportunities } from "@/lib/middles";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { hasProFeatures } from "@/lib/subscription";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

/** Middles are a Pro-only feature — Free/Plus get an empty, gated response. */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await enforcePublicRateLimit(request, "middles", 60);
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
  const opportunities = computeMiddleOpportunities(data);

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
