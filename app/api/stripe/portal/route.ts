import { NextResponse, type NextRequest } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Creates a Stripe billing portal session so the user can manage/cancel their subscription. */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 501 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found yet." },
      { status: 400 }
    );
  }

  const stripe = getStripeClient();
  const origin = request.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${origin}/account`,
  });

  return NextResponse.json({ url: session.url });
}
