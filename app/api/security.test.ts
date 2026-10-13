import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { buildMockOddsProviderData } from "@/lib/mock-data";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";

const state = vi.hoisted(() => ({
  tier: "free", user: null as { id: string; email: string } | null,
  persistenceError: null as { code: string } | null,
  subscriptions: [] as { id: string; customer: string; status: string; items: { data: { id: string; price: { id: string }; quantity: number }[] } }[],
  event: { id: "evt_test", type: "customer.subscription.updated", data: { object: { customer: "cus_test" } } },
  lastTier: "", checkout: vi.fn(), portal: vi.fn(), readFeed: vi.fn(), dailyPreview: vi.fn(),
}));

vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: { stripe_customer_id: "cus_test" }, error: null }) }),
}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: () => ({
  update(values: { subscription_tier: string }) { state.lastTier = values.subscription_tier; return this; },
  eq() { return this; }, select() { return this; }, single: async () => ({ data: state.persistenceError ? null : { id: "user" }, error: state.persistenceError }),
}) }) }));
vi.mock("@/lib/stripe", () => ({ isStripeConfigured: () => true, getStripeClient: () => ({
  webhooks: { constructEvent: () => state.event },
  subscriptions: { list: () => ({ data: state.subscriptions, async *[Symbol.asyncIterator]() { yield* state.subscriptions; } }) },
  billingPortal: { sessions: { create: state.portal } },
  checkout: { sessions: { create: state.checkout } },
}) }));
vi.mock("@/lib/get-request-tier", () => ({ getRequestTierWithOverride: async () => state.tier }));
vi.mock("@/lib/api-rate-limit", () => ({ enforcePublicRateLimit: async () => null }));
vi.mock("@/lib/feed", () => ({ readFeed: state.readFeed, dailyPreview: state.dailyPreview }));

import { POST as webhook } from "./stripe/webhook/route";
import { POST as checkout } from "./stripe/checkout/route";
import { POST as consent } from "./auth/confirm-consent/route";
import { GET as callback } from "./auth/callback/route";
import { GET as comparison } from "./markets/[marketId]/comparison/route";
import { GET as opportunities } from "./opportunities/route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test-secret");
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY", "price_pro");
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY", "price_plus");
  state.tier = "free"; state.user = null; state.persistenceError = null; state.subscriptions = []; state.lastTier = "";
  state.portal.mockResolvedValue({ url: "https://billing.stripe.com/test" });
  const data = buildMockOddsProviderData();
  state.readFeed.mockResolvedValue({ data, isMock: true, capturedAt: new Date().toISOString(), providerName: "mock", warnings: [] });
  state.dailyPreview.mockResolvedValue(findPositiveEV(computeAllOpportunities(data), 2).slice(0, 3));
});

const request = (path: string, body?: unknown) => new NextRequest(`https://example.test${path}`, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json", "stripe-signature": "test" }, body: JSON.stringify(body) });

describe("route trust boundaries", () => {
  it("rejects anonymous consent instead of trusting an email and id", async () => {
    expect((await consent(request("/api/auth/confirm-consent", { accepted: true }))).status).toBe(401);
  });
  it("never redirects a missing-code callback to an external domain", async () => {
    const response = await callback(request("/api/auth/callback?next=https://evil.test"));
    expect(new URL(response.headers.get("location")!).origin).toBe("https://example.test");
  });
  it("blocks free comparison requests before loading feed data", async () => {
    const response = await comparison(request("/api/markets/test/comparison"), { params: Promise.resolve({ marketId: "test" }) });
    expect(response.status).toBe(403);
    expect(state.readFeed).not.toHaveBeenCalled();
  });
  it("keeps daily preview selection fixed before user filters", async () => {
    const all = await (await opportunities(request("/api/opportunities?minEv=0"))).json();
    const filtered = await (await opportunities(request("/api/opportunities?minEv=0&sport=Football"))).json();
    expect(all.opportunities).toHaveLength(3);
    expect(filtered.opportunities.every((item: { id: string }) => all.opportunities.some((allowed: { id: string }) => allowed.id === item.id))).toBe(true);
    expect(filtered.facets.sports).toEqual(all.facets.sports);
  });
});

describe("billing lifecycle", () => {
  it("returns a retryable failure when subscription persistence fails", async () => {
    state.persistenceError = { code: "unavailable" };
    expect((await webhook(request("/api/stripe/webhook", {}))).status).toBe(503);
  });
  it("fails closed on an unknown active price", async () => {
    state.subscriptions = [{ id: "sub", customer: "cus_test", status: "active", items: { data: [{ id: "item", price: { id: "unknown" }, quantity: 1 }] } }];
    expect((await webhook(request("/api/stripe/webhook", {}))).status).toBe(503);
    expect(state.lastTier).toBe("");
  });
  it("repeated events reconcile to the current active tier", async () => {
    state.subscriptions = [{ id: "sub", customer: "cus_test", status: "active", items: { data: [{ id: "item", price: { id: "price_plus" }, quantity: 1 }] } }];
    expect((await webhook(request("/api/stripe/webhook", {}))).status).toBe(200);
    expect((await webhook(request("/api/stripe/webhook", {}))).status).toBe(200);
    expect(state.lastTier).toBe("plus");
  });
  it("routes an existing subscriber into confirmed plan changes, not checkout", async () => {
    state.user = { id: "user", email: "person@example.test" };
    state.subscriptions = [{ id: "sub", customer: "cus_test", status: "active", items: { data: [{ id: "item", price: { id: "price_plus" }, quantity: 1 }] } }];
    expect((await checkout(request("/api/stripe/checkout", { tier: "pro", interval: "month" }))).status).toBe(200);
    expect(state.checkout).not.toHaveBeenCalled();
    expect(state.portal).toHaveBeenCalledWith(expect.objectContaining({ flow_data: expect.objectContaining({ type: "subscription_update_confirm" }) }));
  });
});