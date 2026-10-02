import { NextResponse } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";

/** Public health-check endpoint backing the /status page — no auth required. */
export async function GET() {
  const startedAt = Date.now();
  let providerName = "unavailable";
  let isMock = false;
  try {
    const provider = getOddsProvider();
    providerName = provider.name;
    isMock = provider.isMock;
    const data = await provider.fetchData();
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
      oddsApiCacheSeconds: Number(process.env.ODDS_API_CACHE_SECONDS ?? 3600),
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
        oddsApiCacheSeconds: Number(process.env.ODDS_API_CACHE_SECONDS ?? 3600),
      },
      { status: 503 }
    );
  }
}
