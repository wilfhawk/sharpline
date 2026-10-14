import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dashboardProfileSchema, sanitizeProfile } from "@/lib/dashboard-profile";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Profiles are stored on this device." }, { status: 401 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to sync your profile." }, { status: 401 });
  const { data, error } = await supabase.from("dashboard_profiles").select("leagues,sportsbooks").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Profile unavailable." }, { status: 503 });
  return NextResponse.json({ profile: data ? sanitizeProfile(data) : null });
}

export async function PUT(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Not configured." }, { status: 401 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const parsed = dashboardProfileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  const { error } = await supabase.from("dashboard_profiles").upsert({ user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: "Could not save profile." }, { status: 503 });
  return NextResponse.json({ profile: parsed.data });
}
