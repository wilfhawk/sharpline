import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OddsProviderData } from "@/lib/odds-provider";
import { getOddsProvider } from "@/lib/odds-provider";
import { closingFairProbability, CLOSING_WINDOW_MS } from "@/lib/prediction-scoring";
import { isCronAuthorized } from "@/lib/cron-auth";
import type { MarketSide } from "@/lib/types";

export const maxDuration = 60;

const LOOKBACK_MS = 3 * 86_400_000;

/** Vercel Cron target: fills in the closing fair probability for logged predictions whose events have started. */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(process.env.CRON_SECRET, process.env.NODE_ENV, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 501 });

  const provider = getOddsProvider();
  if (provider.isMock) return NextResponse.json({ checked: 0, scored: 0, skipped: "mock" });

  const admin = createAdminClient();
  const now = Date.now();
  const { data: pending, error } = await admin
    .from("prediction_log")
    .select("id, market_id, side, event_start_time")
    .is("closing_fair_probability", null)
    .lte("event_start_time", new Date(now).toISOString())
    .gte("event_start_time", new Date(now - LOOKBACK_MS).toISOString())
    .order("event_start_time")
    .limit(300);
  if (error) return NextResponse.json({ error: "Prediction lookup failed." }, { status: 503 });
  if (!pending || pending.length === 0) return NextResponse.json({ checked: 0, scored: 0 });

  const snapshotByStart = new Map<string, { data: OddsProviderData; capturedAt: string } | null>();
  let scored = 0;

  for (const row of pending) {
    const startIso = row.event_start_time as string;
    const startMs = Date.parse(startIso);
    if (!snapshotByStart.has(startIso)) {
      const { data: snapshots, error: snapshotError } = await admin
        .from("feed_snapshots")
        .select("data,captured_at")
        .eq("provider_name", provider.name)
        .gte("captured_at", new Date(startMs - CLOSING_WINDOW_MS).toISOString())
        .lte("captured_at", startIso)
        .order("captured_at", { ascending: false })
        .limit(1);
      if (snapshotError) return NextResponse.json({ error: "Closing snapshot lookup failed." }, { status: 503 });
      const snapshot = snapshots?.[0];
      snapshotByStart.set(startIso, snapshot ? { data: snapshot.data as OddsProviderData, capturedAt: snapshot.captured_at } : null);
    }
    const snapshot = snapshotByStart.get(startIso);
    if (!snapshot) continue;

    const closing = closingFairProbability(snapshot.data, row.market_id as string, row.side as MarketSide, startMs);
    if (closing === null) continue;
    const { error: updateError } = await admin
      .from("prediction_log")
      .update({ closing_fair_probability: closing, closing_captured_at: snapshot.capturedAt })
      .eq("id", row.id)
      .is("closing_fair_probability", null);
    if (updateError) return NextResponse.json({ error: "Prediction scoring failed." }, { status: 503 });
    scored += 1;
  }

  return NextResponse.json({ checked: pending.length, scored });
}
