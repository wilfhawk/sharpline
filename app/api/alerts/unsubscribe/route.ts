import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const token = z.string().uuid().safeParse(request.nextUrl.searchParams.get("token"));
  if (!token.success) return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  const { error } = await createAdminClient().from("alert_preferences").update({ email_enabled: false }).eq("unsubscribe_token", token.data);
  if (error) return NextResponse.json({ error: "Could not unsubscribe. Please retry." }, { status: 503 });
  return NextResponse.redirect(new URL("/unsubscribe?done=1", request.url), 303);
}