import { NextResponse, type NextRequest } from "next/server";
import { getOddsProvider } from "@/lib/odds-provider";
import { buildBookComparisonRows } from "@/lib/opportunities";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const rateLimitResponse = await enforcePublicRateLimit(request, "market-comparison", 60);
  if (rateLimitResponse) return rateLimitResponse;

  const { marketId } = await params;
  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const rows = buildBookComparisonRows(data, marketId);

  return NextResponse.json({ rows });
}
