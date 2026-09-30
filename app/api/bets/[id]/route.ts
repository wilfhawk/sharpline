import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { computeClv } from "@/lib/clv";
import { z } from "zod";

const closeBetSchema = z.object({
  closingFairProbability: z.number().gt(0).lt(1),
});

/** Records the closing fair probability for a logged bet and computes its CLV%. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = closeBetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { data: bet, error: fetchError } = await supabase
    .from("logged_bets")
    .select("odds_decimal")
    .eq("id", id)
    .single();

  if (fetchError || !bet) {
    return NextResponse.json({ error: "Bet not found." }, { status: 404 });
  }

  const clvPercent = computeClv(
    bet.odds_decimal as number,
    parsed.data.closingFairProbability
  );

  const { data, error } = await supabase
    .from("logged_bets")
    .update({
      closing_fair_probability: parsed.data.closingFairProbability,
      clv_percent: clvPercent,
      closed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bet: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase.from("logged_bets").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
