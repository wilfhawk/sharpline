import { NextResponse } from "next/server";
import { getOddsProvider, getOddsCacheSeconds } from "@/lib/odds-provider";
import { readFeed } from "@/lib/feed";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";
import type { NextRequest } from "next/server";

/** Public health-check endpoint backing the /status page — no auth required. */
export async function GET(request: NextRequest) {
  const limited = await enforcePublicRateLimit(request, "health", 30);
  if (limited) return limited;
  const startedAt = Date.now();
  let providerName = "unavailable";
  let isMock = false;
  try {
    const provider = getOddsProvider();
    providerName = provider.name;
    isMock = provider.isMock;
    const feed = await readFeed();
    const data = feed.data;
    return NextResponse.json({
      ok: true,
      errorMessage: null,
      providerName,
      isMock,
      eventCount: data.events.length,
      fetchDurationMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      pollIntervalSeconds: 20,
      livePollIntervalSeconds: 8,
      oddsApiCacheSeconds: getOddsCacheSeconds(),
      capturedAt: feed.capturedAt,
      warnings: feed.warnings,
    });
  } catch (err) {
    console.error("Odds health check failed", err instanceof Error ? err.name : "UnknownError");
    return NextResponse.json(
      {
        ok: false,
        errorMessage: "Odds data is temporarily unavailable.",
        providerName,
        isMock,
        eventCount: 0,
        fetchDurationMs: Date.now() - startedAt,
        checkedAt: new Date().toISOString(),
        pollIntervalSeconds: 20,
        livePollIntervalSeconds: 8,
        oddsApiCacheSeconds: getOddsCacheSeconds(),
      },
      { status: 503 }
    );
  }
}
