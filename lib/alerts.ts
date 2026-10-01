import type { OpportunityFilters } from "@/hooks/useOpportunities";
import type { ArbitrageOpportunity } from "./arbitrage";
import type { MiddleOpportunity } from "./middles";
import type { EvOpportunity } from "./types";

export type AlertOpportunityType = "ev" | "arbitrage" | "middle";

/** Normalized shape shared by +EV/arbitrage/middle opportunities for alert matching + dedup. */
export interface AlertCandidate {
  opportunityType: AlertOpportunityType;
  marketId: string;
  sportsbookSlug: string;
  side: "A" | "B";
  evPercent: number | null;
  eventLabel: string;
  sideLabel: string;
}

/** A previously-sent alert, as read back from alert_log, for dedup. */
export interface SentAlert {
  marketId: string;
  sportsbookSlug: string;
  side: "A" | "B";
  sentAt: string; // ISO timestamp
}

/** True when an +EV opportunity satisfies a saved filter preset's criteria. */
export function matchesSavedFilter(
  opportunity: EvOpportunity,
  filters: OpportunityFilters
): boolean {
  if (filters.sport && opportunity.event.sport !== filters.sport) return false;
  if (filters.sportsbookSlug && opportunity.sportsbook.slug !== filters.sportsbookSlug) return false;
  if (filters.marketType && opportunity.market.marketType !== filters.marketType) return false;
  if (filters.minEv !== undefined && opportunity.evPercent < filters.minEv) return false;
  return true;
}

/** +EV opportunities matching ANY of a user's saved filters, as alert candidates. */
export function buildEvAlertCandidates(
  opportunities: EvOpportunity[],
  savedFilterSets: OpportunityFilters[]
): AlertCandidate[] {
  if (savedFilterSets.length === 0) return [];
  const matched = opportunities.filter((o) =>
    savedFilterSets.some((filters) => matchesSavedFilter(o, filters))
  );
  return matched.map((o) => ({
    opportunityType: "ev",
    marketId: o.market.id,
    sportsbookSlug: o.sportsbook.slug,
    side: o.side,
    evPercent: o.evPercent,
    eventLabel: `${o.event.awayTeam} @ ${o.event.homeTeam}`,
    sideLabel: o.sideLabel,
  }));
}

/**
 * Arbitrage/middles have no per-filter criteria in the saved-filters UI (it's
 * +EV-specific: sport/book/market/minEv) — every new arbitrage or middle is
 * alert-worthy on its own since both are rare and close quickly. Pro-only,
 * enforced by the caller (see app/api/cron/alerts).
 */
export function buildArbitrageAlertCandidates(
  opportunities: ArbitrageOpportunity[]
): AlertCandidate[] {
  return opportunities.map((o) => ({
    opportunityType: "arbitrage",
    marketId: o.market.id,
    sportsbookSlug: o.sideA.sportsbook.slug,
    side: o.sideA.side,
    evPercent: o.profitPercent,
    eventLabel: `${o.event.awayTeam} @ ${o.event.homeTeam}`,
    sideLabel: `${o.sideA.sideLabel} / ${o.sideB.sideLabel}`,
  }));
}

export function buildMiddleAlertCandidates(opportunities: MiddleOpportunity[]): AlertCandidate[] {
  return opportunities.map((o) => ({
    opportunityType: "middle",
    marketId: `${o.event.id}:${o.marketType}:${o.windowLow}-${o.windowHigh}`,
    sportsbookSlug: o.overLeg.sportsbook.slug,
    side: "A",
    evPercent: o.bothWinProfitPercent,
    eventLabel: `${o.event.awayTeam} @ ${o.event.homeTeam}`,
    sideLabel: `${o.overLeg.sideLabel} / ${o.underLeg.sideLabel}`,
  }));
}

/**
 * Dedup: suppress re-alerting the same (market, book, side) within the
 * cooldown window, even if its EV% fluctuates slightly while it persists.
 */
export function shouldSendAlert(
  candidate: AlertCandidate,
  recentAlerts: SentAlert[],
  nowMs: number,
  cooldownMs: number
): boolean {
  return !recentAlerts.some(
    (alert) =>
      alert.marketId === candidate.marketId &&
      alert.sportsbookSlug === candidate.sportsbookSlug &&
      alert.side === candidate.side &&
      nowMs - new Date(alert.sentAt).getTime() < cooldownMs
  );
}

/** Filters a list of candidates down to the ones that should actually be sent, given recent alert history. */
export function filterNewAlertCandidates(
  candidates: AlertCandidate[],
  recentAlerts: SentAlert[],
  nowMs: number,
  cooldownMs: number
): AlertCandidate[] {
  return candidates.filter((c) => shouldSendAlert(c, recentAlerts, nowMs, cooldownMs));
}
