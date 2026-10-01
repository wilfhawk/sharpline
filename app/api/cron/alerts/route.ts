import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getOddsProvider } from "@/lib/odds-provider";
import { computeAllOpportunities } from "@/lib/opportunities";
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

export const maxDuration = 60;

const COOLDOWN_MS = 30 * 60 * 1000;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured yet — allow (dev/local convenience)
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function renderDigestHtml(candidates: AlertCandidate[]): string {
  const rows = candidates
    .map(
      (c) =>
        `<li><strong>${c.eventLabel}</strong> — ${c.sideLabel} (${c.sportsbookSlug}) — ${
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
  if (!isAuthorized(request)) {
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

  const { data: savedFilters } = await admin
    .from("saved_filters")
    .select("id, user_id, filters")
    .in("user_id", userIds);

  const cutoffIso = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { data: recentAlerts } = await admin
    .from("alert_log")
    .select("user_id, market_id, sportsbook_slug, side, sent_at")
    .in("user_id", userIds)
    .gte("sent_at", cutoffIso);

  const provider = getOddsProvider();
  const data = await provider.fetchData();
  const evOpportunities = computeAllOpportunities(data);
  const arbitrageOpportunities = computeArbitrageOpportunities(data);
  const middleOpportunities = computeMiddleOpportunities(data);

  let usersAlerted = 0;
  let alertsSent = 0;

  for (const user of users) {
    if (!canReceiveAlerts(user.subscription_tier)) continue;

    const filterSets: OpportunityFilters[] = (savedFilters ?? [])
      .filter((f) => f.user_id === user.id)
      .map((f) => f.filters as OpportunityFilters);

    let candidates = buildEvAlertCandidates(evOpportunities, filterSets);
    if (hasProFeatures(user.subscription_tier)) {
      candidates = candidates.concat(
        buildArbitrageAlertCandidates(arbitrageOpportunities),
        buildMiddleAlertCandidates(middleOpportunities)
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

    const newCandidates = filterNewAlertCandidates(candidates, userRecentAlerts, Date.now(), COOLDOWN_MS);
    if (newCandidates.length === 0) continue;

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `SharpLine: ${newCandidates.length} new opportunit${newCandidates.length === 1 ? "y" : "ies"}`,
        html: renderDigestHtml(newCandidates),
      });
    }

    await admin.from("alert_log").insert(
      newCandidates.map((c) => ({
        user_id: user.id,
        opportunity_type: c.opportunityType,
        market_id: c.marketId,
        sportsbook_slug: c.sportsbookSlug,
        side: c.side,
        ev_percent: c.evPercent,
      }))
    );

    usersAlerted += 1;
    alertsSent += newCandidates.length;
  }

  return NextResponse.json({ checked: users.length, usersAlerted, alertsSent });
}
