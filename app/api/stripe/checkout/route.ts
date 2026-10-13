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

  const body = await request.json().catch(() => null);
  if (!body || !["plus", "pro"].includes(body.tier) || !["month", "year"].includes(body.interval)) {
    return NextResponse.json({ error: "Invalid plan or billing interval." }, { status: 400 });
  }
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

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Account is unavailable." }, { status: 503 });
  }

  let customerId = profile?.stripe_customer_id as string | null | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabaseUserId: user.id },
    }, { idempotencyKey: `customer:${user.id}` });
    customerId = customer.id;
    const { error } = await admin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: "Could not save billing account." }, { status: 503 });
  }

  const origin = request.nextUrl.origin;

  const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  const existing = subscriptions.data.filter((subscription) => !["canceled", "incomplete_expired"].includes(subscription.status));
  if (existing.length > 0) {
    const subscription = existing[0];
    const item = subscription.items.data[0];
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
      ...(existing.length === 1 && item && subscription.status === "active" ? {
        flow_data: {
          type: "subscription_update_confirm" as const,
          subscription_update_confirm: {
            subscription: subscription.id,
            items: [{ id: item.id, price: priceId, quantity: item.quantity ?? 1 }],
          },
        },
      } : {}),
    });
    return NextResponse.json({ url: portal.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/account?checkout=success`,
    cancel_url: `${origin}/account?checkout=cancelled`,
  }, { idempotencyKey: `checkout:${user.id}:${priceId}:${Math.floor(Date.now() / 1_800_000)}` });

  return NextResponse.json({ url: session.url });
}
