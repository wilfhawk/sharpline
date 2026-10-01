import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getTierForPriceId } from "@/lib/stripe-prices";
import type { SubscriptionTier } from "@/lib/types";

async function setTierByCustomerId(customerId: string, tier: SubscriptionTier) {
  const admin = createAdminClient();
  await admin
    .from("users")
    .update({ subscription_tier: tier })
    .eq("stripe_customer_id", customerId);
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.customer !== "string") break;

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items"],
      });
      const priceId = fullSession.line_items?.data[0]?.price?.id;
      const resolved = priceId ? getTierForPriceId(priceId) : null;
      // Defaults to "pro" if the price isn't recognized (shouldn't happen for
      // sessions created by our own checkout route) rather than silently no-op.
      await setTierByCustomerId(session.customer, resolved?.tier ?? "pro");
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const isActive = ["active", "trialing"].includes(subscription.status);
      if (typeof subscription.customer !== "string") break;

      if (!isActive) {
        await setTierByCustomerId(subscription.customer, "free");
        break;
      }
      const priceId = subscription.items.data[0]?.price?.id;
      const resolved = priceId ? getTierForPriceId(priceId) : null;
      await setTierByCustomerId(subscription.customer, resolved?.tier ?? "pro");
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        await setTierByCustomerId(subscription.customer, "free");
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
