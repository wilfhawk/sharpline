import { NextResponse, type NextRequest } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
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

  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const opportunities = computeArbitrageOpportunities(data);

  return NextResponse.json({
    opportunities,
    meta: {
      isMock: provider.isMock,
      providerName: provider.name,
      generatedAt: new Date().toISOString(),
      gated: false,
    },
  });
}
