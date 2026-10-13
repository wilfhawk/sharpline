import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const bodySchema = z.object({
  accepted: z.literal(true),
});

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      age_gate_consented_at: new Date().toISOString(),
      jurisdiction_confirmed: true,
    })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: "Could not record consent." }, { status: 503 });

  return NextResponse.json({ ok: true });
}
