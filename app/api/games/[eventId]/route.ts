import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { buildGamePredictions } from "@/lib/game-predictions";
import { parseListParam } from "@/lib/dashboard-profile";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { hasProFeatures } from "@/lib/subscription";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const limited = await enforcePublicRateLimit(request, "game-predictions", 60);
  if (limited) return limited;
  try {
    const { eventId } = await params;
    const tier = await getRequestTierWithOverride(request);
    const feed = await readFeed();
    const search = request.nextUrl.searchParams;
    const method = hasProFeatures(tier) && search.get("devigMethod") === "power" ? "power" : "multiplicative";
    const view = buildGamePredictions(feed.data, eventId, {
      tier,
      method,
      bookSlugs: parseListParam(search.get("sportsbooks")),
    });
    if (!view) return NextResponse.json({ error: "Game not found." }, { status: 404 });
    return NextResponse.json({
      ...view,
      // Free sees the matchup but no model output.
      locked: tier === "free",
      meta: { tier, isMock: feed.isMock, capturedAt: feed.capturedAt, warnings: feed.warnings },
    });
  } catch (error) {
    console.error("game_predictions_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Predictions are temporarily unavailable." }, { status: 503 });
  }
}
