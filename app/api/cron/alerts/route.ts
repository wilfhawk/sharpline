import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readFeed } from "@/lib/feed";
import { computeAllOpportunities } from "@/lib/opportunities";
import { attachPredictions } from "@/lib/predictions";
import { computeArbitrageOpportunities } from "@/lib/arbitrage";
import { computeMiddleOpportunities } from "@/lib/middles";
import { canReceiveAlerts, hasProFeatures } from "@/lib/subscription";
import {
  buildArbitrageAlertCandidates,
  buildEvAlertCandidates,
  buildMiddleAlertCandidates,
  filterNewAlertCandidates,
  type AlertCandidate,
  type SentAlert,
} from "@/lib/alerts";
import { sendEmail } from "@/lib/email/resend";
import { formatEvPercent } from "@/lib/display";
import type { OpportunityFilters } from "@/hooks/useOpportunities";
import { isCronAuthorized } from "@/lib/cron-auth";

export const maxDuration = 60;

const COOLDOWN_MS = 30 * 60 * 1000;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

function renderDigestHtml(candidates: AlertCandidate[]): string {
  const rows = candidates
    .map(
      (c) =>
        `<li><strong>${escapeHtml(c.eventLabel)}</strong> — ${escapeHtml(c.sideLabel)} (${escapeHtml(c.sportsbookSlug)}) — ${
          c.evPercent !== null ? formatEvPercent(c.evPercent) : "—"
        } [${c.opportunityType}]</li>`
    )
    .join("");
  return `<p>New opportunities matching your SharpLine alerts:</p><ul>${rows}</ul>`;
}

/**
 * Vercel Cron target: evaluates every Plus/Pro user's saved filters (+ for Pro,
 * every new arbitrage/middle) against the latest odds, dedupes against
 * alert_log (30-min cooldown per market/book/side), and emails one digest per
 * user for anything new. Schedule in vercel.json; protect with CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(process.env.CRON_SECRET, process.env.NODE_ENV, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured." }, { status: 501 });
  }

  const admin = createAdminClient();

  const { data: users, error: usersError } = await admin
    .from("users")
    .select("id, email, subscription_tier")
    .in("subscription_tier", ["plus", "pro"]);
  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }
  if (!users || users.length === 0) {
    return NextResponse.json({ checked: 0, usersAlerted: 0, alertsSent: 0 });
  }

  const userIds = users.map((u) => u.id);

  const { data: preferences, error: preferencesError } = await admin.from("alert_preferences").select("*").in("user_id", userIds).eq("email_enabled", true);
  if (preferencesError) return NextResponse.json({ error: "Alert preferences unavailable." }, { status: 503 });
  const { data: savedFilters, error: filtersError } = await admin
    .from("saved_filters")
    .select("id, user_id, filters")
    .in("user_id", userIds);

  const cutoffIso = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { data: recentAlerts, error: recentError } = await admin
    .from("alert_log")
    .select("user_id, market_id, sportsbook_slug, side, sent_at")
    .in("user_id", userIds)
    .gte("sent_at", cutoffIso);

  if (filtersError || recentError) return NextResponse.json({ error: "Alert history unavailable." }, { status: 503 });
  const feed = await readFeed();
  if (feed.isMock) return NextResponse.json({ checked: 0, usersAlerted: 0, alertsSent: 0, skipped: "mock" });
  const data = feed.data;
  const evOpportunities = computeAllOpportunities(data);
  const arbitrageOpportunities = computeArbitrageOpportunities(data);
  const middleOpportunities = computeMiddleOpportunities(data);

  let usersAlerted = 0;
  let alertsSent = 0;

  for (const user of users) {
    if (!canReceiveAlerts(user.subscription_tier)) continue;
    const preference = preferences?.find((item) => item.user_id === user.id);
    if (!preference) continue;

    const filterSets: OpportunityFilters[] = (savedFilters ?? [])
      .filter((f) => f.user_id === user.id)
      .map((f) => f.filters as OpportunityFilters);

    const modelOpportunities = hasProFeatures(user.subscription_tier) && filterSets.some((filters) => filters.devigMethod === "power")
      ? computeAllOpportunities(data, "power") : evOpportunities;
    let candidates = preference.ev_enabled ? filterSets.flatMap((filters) => {
      const isPro = hasProFeatures(user.subscription_tier);
      const method = filters.devigMethod === "power" && isPro ? "power" : "multiplicative";
      const base = method === "power" ? modelOpportunities : evOpportunities;
      // Model agreement is Pro-only; Plus filters ignore it.
      const wantsModel = isPro && filters.modelAgrees === true;
      return buildEvAlertCandidates(
        wantsModel ? attachPredictions(data, base, method) : base,
        [{ ...filters, modelAgrees: wantsModel }]
      );
    }).filter((candidate) => (candidate.evPercent ?? 0) >= preference.threshold_percent) : [];
    candidates = [...new Map(candidates.map((candidate) => [`${candidate.marketId}:${candidate.sportsbookSlug}:${candidate.side}`, candidate])).values()];
    if (hasProFeatures(user.subscription_tier)) {
      candidates = candidates.concat(
        preference.arbitrage_enabled ? buildArbitrageAlertCandidates(arbitrageOpportunities) : [],
        preference.middles_enabled ? buildMiddleAlertCandidates(middleOpportunities) : []
      );
    }
    if (candidates.length === 0) continue;

    const userRecentAlerts: SentAlert[] = (recentAlerts ?? [])
      .filter((a) => a.user_id === user.id)
      .map((a) => ({
        marketId: a.market_id,
        sportsbookSlug: a.sportsbook_slug,
        side: a.side,
        sentAt: a.sent_at,
      }));

    let newCandidates = filterNewAlertCandidates(candidates, userRecentAlerts, Date.now(), COOLDOWN_MS);
    if (newCandidates.length === 0) continue;

    if (!user.email) continue;

    const deliveryKey = `${user.id}:${Math.floor(Date.now() / COOLDOWN_MS)}`;
    const unsubscribePage = `${request.nextUrl.origin}/unsubscribe?token=${preference.unsubscribe_token}`;
    const unsubscribeUrl = `${request.nextUrl.origin}/api/alerts/unsubscribe?token=${preference.unsubscribe_token}`;
    const { error: deliveryError } = await admin.from("alert_deliveries").upsert({
      delivery_key: deliveryKey, user_id: user.id, recipient: user.email,
      subject: `SharpLine: ${newCandidates.length} new opportunities`,
      html: `${renderDigestHtml(newCandidates)}<p><a href="${escapeHtml(unsubscribePage)}">Unsubscribe</a></p>`,
      candidates: newCandidates, unsubscribe_url: unsubscribeUrl,
    }, { onConflict: "delivery_key", ignoreDuplicates: true });
    if (deliveryError) return NextResponse.json({ error: "Could not queue alerts." }, { status: 503 });
    const { data: delivery, error: queuedError } = await admin.from("alert_deliveries").select("*").eq("delivery_key", deliveryKey).single();
    if (queuedError || !delivery) return NextResponse.json({ error: "Queued alert unavailable." }, { status: 503 });
    if (delivery.sent_at) continue;
    newCandidates = delivery.candidates as AlertCandidate[];
    const emailSent = await sendEmail({ to: delivery.recipient, subject: delivery.subject, html: delivery.html, idempotencyKey: deliveryKey, unsubscribeUrl: delivery.unsubscribe_url });
    if (!emailSent) continue;

    const { error: alertLogError } = await admin.from("alert_log").insert(
      newCandidates.map((c) => ({
        user_id: user.id,
        opportunity_type: c.opportunityType,
        market_id: c.marketId,
        sportsbook_slug: c.sportsbookSlug,
        side: c.side,
        ev_percent: c.evPercent,
      }))
    );
    if (alertLogError) {
      console.error("Alert email sent but delivery log insert failed", alertLogError.code);
      return NextResponse.json({ error: "Alert delivery logging failed." }, { status: 500 });
    }

    usersAlerted += 1;
    const { error: sentError } = await admin.from("alert_deliveries").update({ sent_at: new Date().toISOString() }).eq("delivery_key", deliveryKey);
    if (sentError) return NextResponse.json({ error: "Delivery confirmation failed." }, { status: 503 });
    alertsSent += newCandidates.length;
  }

  return NextResponse.json({ checked: users.length, usersAlerted, alertsSent });
}
