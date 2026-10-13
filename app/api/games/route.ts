import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { buildGameCatalog } from "@/lib/game-catalog";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

export async function GET(request: NextRequest) {
  const limited = await enforcePublicRateLimit(request, "games", 60);
  if (limited) return limited;
  try {
    const feed = await readFeed();
    return NextResponse.json({ games: buildGameCatalog(feed.data), meta: { tier: await getRequestTierWithOverride(request), isMock: feed.isMock, capturedAt: feed.capturedAt, warnings: feed.warnings } });
  } catch (error) {
    console.error("game_catalog_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Games are temporarily unavailable." }, { status: 503 });
  }
}