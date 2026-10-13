import { NextResponse, type NextRequest } from "next/server";
import { getRequestTierWithOverride } from "@/lib/get-request-tier";
import { enforcePublicRateLimit } from "@/lib/api-rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOddsProvider, type OddsProviderData } from "@/lib/odds-provider";

export async function GET(request: NextRequest, { params }: { params: Promise<{ marketId: string }> }) {
  const limited = await enforcePublicRateLimit(request, "history", 60);
  if (limited) return limited;
  if (await getRequestTierWithOverride(request) === "free") return NextResponse.json({ error: "Price history requires Plus or Pro." }, { status: 403 });
  const { marketId } = await params;
  const book = request.nextUrl.searchParams.get("book");
  const side = request.nextUrl.searchParams.get("side");
  if (!book || !["A", "B"].includes(side ?? "")) return NextResponse.json({ error: "Invalid market selection." }, { status: 400 });
  const provider = getOddsProvider();
  if (provider.isMock) return NextResponse.json({ history: [] });
  const { data, error } = await createAdminClient().from("feed_snapshots").select("data,captured_at")
    .eq("provider_name", provider.name).gte("captured_at", new Date(Date.now() - 86_400_000).toISOString())
    .order("captured_at", { ascending: false }).limit(300);
  if (error) return NextResponse.json({ error: "History unavailable." }, { status: 503 });
  const history = (data ?? []).reverse().flatMap((snapshot) => {
    const quote = (snapshot.data as OddsProviderData).quotes.find((item) => item.marketId === marketId && item.sportsbookId === book);
    return quote ? [{ label: snapshot.captured_at, oddsDecimal: side === "A" ? quote.oddsDecimalA : quote.oddsDecimalB }] : [];
  });
  return NextResponse.json({ history });
}