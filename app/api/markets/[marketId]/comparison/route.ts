import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { buildBookComparisonRows } from "@/lib/opportunities";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const rateLimitResponse = await enforcePublicRateLimit(request, "market-comparison", 60);
  if (rateLimitResponse) return rateLimitResponse;
  const tier = await getRequestTierWithOverride(request);
  if (tier === "free") return NextResponse.json({ error: "Full market comparison requires Plus or Pro." }, { status: 403 });

  const { marketId } = await params;
  const feed = await readFeed();
  const method = tier === "pro" && request.nextUrl.searchParams.get("devigMethod") === "power" ? "power" : "multiplicative";
  const rows = buildBookComparisonRows(feed.data, marketId, method);

  return NextResponse.json({ rows, capturedAt: feed.capturedAt });
}
