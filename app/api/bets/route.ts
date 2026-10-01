import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { logBetSchema } from "@/lib/validation/bets";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("logged_bets")
    .select("*")
    .order("placed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bets: data });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = logBetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const values = parsed.data;
  const { data, error } = await supabase
    .from("logged_bets")
    .insert({
      user_id: user.id,
      event_label: values.eventLabel,
      market_label: values.marketLabel,
      sportsbook_name: values.sportsbookName,
      odds_decimal: values.oddsDecimal,
      stake: values.stake,
      fair_probability_at_bet: values.fairProbabilityAtBet,
      market_id: values.marketId ?? null,
      sportsbook_slug: values.sportsbookSlug ?? null,
      side: values.side ?? null,
      event_start_time: values.eventStartTime ?? null,
      // No market_id means the closing-line cron can never find this bet again.
      closing_line_status: values.marketId ? "pending" : "missed",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bet: data }, { status: 201 });
}
