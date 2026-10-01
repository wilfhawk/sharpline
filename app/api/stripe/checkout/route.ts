import { NextResponse, type NextRequest } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPriceId, type BillingInterval, type PaidTier } from "@/lib/stripe-prices";

/** Creates a Stripe Checkout session for the chosen paid tier/interval (test mode) for the signed-in user. */
export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Billing is not configured yet." },
      { status: 501 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const tier: PaidTier = body.tier === "plus" ? "plus" : "pro";
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";

  const priceId = getPriceId(tier, interval);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${tier}/${interval} yet.` },
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

  const stripe = getStripeClient();
  const admin = createAdminClient();

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | null | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabaseUserId: user.id },
    });
    customerId = customer.id;
    await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
