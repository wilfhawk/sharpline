import Stripe from "stripe";

// COMPLIANCE.md: standard Stripe accounts may flag/reject gambling-odds-comparison
// businesses under prohibited/restricted categories — confirm with Stripe or budget
// time for a high-risk-friendly processor (Authorize.net, Paysafe) before launch.
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(secretKey);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
