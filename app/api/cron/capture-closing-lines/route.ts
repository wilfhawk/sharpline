import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeAllOpportunities } from "@/lib/opportunities";
import { computeClv } from "@/lib/clv";
import { isCronAuthorized } from "@/lib/cron-auth";

export const maxDuration = 60;

/** How long past kickoff we keep retrying before giving up and marking "missed"
 * (the provider may not post a line again, or the game may already be over). */
const MISSED_AFTER_MS = 3 * 60 * 60 * 1000;

/**
 * Vercel Cron target: for every logged bet still "pending" whose event has
 * started, re-fetches the odds feed and looks up the SAME market/book/side
 * to capture the closing (fair) price, then computes real CLV. Bets whose
 * market can no longer be found well past kickoff are marked "missed" (the
 * manual "closing fair %" entry in My Bets remains available as a fallback).
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(process.env.CRON_SECRET, process.env.NODE_ENV, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const admin = createAdminClient();

  const { data: pendingBets, error } = await admin
    .from("logged_bets")
    .select("id, odds_decimal, market_id, sportsbook_slug, side, event_start_time")
    .eq("closing_line_status", "pending")
    .not("market_id", "is", null)
    .lte("event_start_time", new Date().toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!pendingBets || pendingBets.length === 0) {
    return NextResponse.json({ checked: 0, captured: 0, missed: 0 });
  }

  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const opportunities = computeAllOpportunities(data);

  let captured = 0;
  let missed = 0;

  for (const bet of pendingBets) {
    const match = opportunities.find(
      (o) =>
        o.market.id === bet.market_id &&
        o.sportsbook.slug === bet.sportsbook_slug &&
        o.side === bet.side
    );

    if (match) {
      const clvPercent = computeClv(bet.odds_decimal as number, match.fairProbability);
      await admin
        .from("logged_bets")
        .update({
          closing_fair_probability: match.fairProbability,
          clv_percent: clvPercent,
          closed_at: new Date().toISOString(),
          closing_line_status: "captured",
          closing_captured_at: new Date().toISOString(),
        })
        .eq("id", bet.id);
      captured += 1;
      continue;
    }

    const startedMsAgo = Date.now() - new Date(bet.event_start_time as string).getTime();
    if (startedMsAgo > MISSED_AFTER_MS) {
      await admin.from("logged_bets").update({ closing_line_status: "missed" }).eq("id", bet.id);
      missed += 1;
    }
    // else: leave pending, retry next run — the sharp book may post its
    // closing line shortly after kickoff rather than exactly at it.
  }

  return NextResponse.json({ checked: pendingBets.length, captured, missed });
}
