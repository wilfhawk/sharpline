import { NextResponse } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";

/** Public health-check endpoint backing the /status page — no auth required. */
export async function GET() {
  const provider = getOddsProvider();
  const startedAt = Date.now();

  let eventCount = 0;
  let ok = true;
  let errorMessage: string | null = null;
  try {
    const data = await provider.fetchData();
    eventCount = data.events.length;
  } catch (err) {
    ok = false;
    errorMessage = err instanceof Error ? err.message : "Unknown error";
  }

  return NextResponse.json({
    ok,
    errorMessage,
    providerName: provider.name,
    isMock: provider.isMock,
    eventCount,
    fetchDurationMs: Date.now() - startedAt,
    checkedAt: new Date().toISOString(),
    pollIntervalSeconds: 20,
    livePollIntervalSeconds: 8,
    oddsApiCacheSeconds: Number(process.env.ODDS_API_CACHE_SECONDS ?? 3600),
  });
}
