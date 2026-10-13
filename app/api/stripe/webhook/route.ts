import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTierForPriceId } from "@/lib/stripe-prices";
import type { SubscriptionTier } from "@/lib/types";

async function setTierByCustomerId(customerId: string, tier: SubscriptionTier) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .update({ subscription_tier: tier })
    .eq("stripe_customer_id", customerId)
    .select("id")
    .single();
  if (error || !data) throw new Error("Subscription persistence failed.");
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    if (!webhookSecret || !signature) {
      throw new Error("Missing webhook secret/signature.");
    }
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const handled = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"];
  if (handled.includes(event.type)) {
    try {
      const object = event.data.object as Stripe.Subscription | Stripe.Checkout.Session;
      const customer = typeof object.customer === "string" ? object.customer : object.customer?.id;
      if (!customer) throw new Error("Missing customer.");
      let tier: SubscriptionTier = "free";
      for await (const subscription of stripe.subscriptions.list({ customer, status: "all", limit: 100 })) {
        if (!["active", "trialing"].includes(subscription.status)) continue;
        for (const item of subscription.items.data) {
          const resolved = getTierForPriceId(item.price.id);
          if (!resolved) throw new Error("Unrecognized subscription price.");
          if (tier !== "pro") tier = resolved.tier;
        }
      }
      await setTierByCustomerId(customer, tier);
    } catch (error) {
      console.error("billing_reconciliation_failed", { eventId: event.id, error: error instanceof Error ? error.message : "Unknown error" });
      return NextResponse.json({ error: "Billing reconciliation failed; retry required." }, { status: 503 });
    }
  }

  return NextResponse.json({ received: true });
}
