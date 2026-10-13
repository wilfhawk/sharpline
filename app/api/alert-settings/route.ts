import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const schema = z.object({ email_enabled: z.boolean(), ev_enabled: z.boolean(), arbitrage_enabled: z.boolean(), middles_enabled: z.boolean(), threshold_percent: z.number().finite().min(0).max(100) });
const defaults = { email_enabled: false, ev_enabled: true, arbitrage_enabled: false, middles_enabled: false, threshold_percent: 5 };

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ settings: defaults });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage email alerts." }, { status: 401 });
  const { data, error } = await supabase.from("alert_preferences").select("email_enabled,ev_enabled,arbitrage_enabled,middles_enabled,threshold_percent").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Alert settings unavailable." }, { status: 503 });
  return NextResponse.json({ settings: data ?? defaults });
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  const { error } = await supabase.from("alert_preferences").upsert({ user_id: user.id, ...parsed.data });
  if (error) return NextResponse.json({ error: "Could not save preferences." }, { status: 503 });
  return NextResponse.json({ settings: parsed.data });
}