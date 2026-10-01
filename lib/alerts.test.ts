import { describe, expect, it } from "vitest";
import {
  buildArbitrageAlertCandidates,
  buildEvAlertCandidates,
  buildMiddleAlertCandidates,
  filterNewAlertCandidates,
  matchesSavedFilter,
  shouldSendAlert,
  type AlertCandidate,
  type SentAlert,
} from "./alerts";
import type { EvOpportunity } from "./types";
import type { ArbitrageOpportunity } from "./arbitrage";
import type { MiddleOpportunity } from "./middles";

function makeOpportunity(overrides: Partial<EvOpportunity> = {}): EvOpportunity {
  const event = {
    id: "evt-1",
    sport: "Football",
    league: "NFL",
    homeTeam: "Home",
    awayTeam: "Away",
    startTime: new Date().toISOString(),
    status: "upcoming" as const,
  };
  const market = {
    id: "mkt-1",
    event,
    marketType: "moneyline" as const,
    lineValue: null,
    sideALabel: "Home ML",
    sideBLabel: "Away ML",
  };
  return {
    id: "op-1",
    event,
    market,
    sportsbook: {
      id: "dk",
      name: "DraftKings",
      slug: "draftkings",
      logoUrl: null,
      isSharpReference: false,
    },
    side: "A",
    sideLabel: "Home ML",
    oddsDecimal: 2.1,
    fairOddsDecimal: 1.9,
    fairProbability: 0.52,
    evPercent: 9.2,
    snapshotTimestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("matchesSavedFilter", () => {
  const opportunity = makeOpportunity();

  it("matches when no filters are set", () => {
    expect(matchesSavedFilter(opportunity, {})).toBe(true);
  });

  it("matches on sport", () => {
    expect(matchesSavedFilter(opportunity, { sport: "Football" })).toBe(true);
    expect(matchesSavedFilter(opportunity, { sport: "Basketball" })).toBe(false);
  });

  it("matches on minEv as a floor", () => {
    expect(matchesSavedFilter(opportunity, { minEv: 5 })).toBe(true);
    expect(matchesSavedFilter(opportunity, { minEv: 20 })).toBe(false);
  });

  it("matches on sportsbook and market type together", () => {
    expect(
      matchesSavedFilter(opportunity, { sportsbookSlug: "draftkings", marketType: "moneyline" })
    ).toBe(true);
    expect(
      matchesSavedFilter(opportunity, { sportsbookSlug: "fanduel", marketType: "moneyline" })
    ).toBe(false);
  });
});

describe("buildEvAlertCandidates", () => {
  it("returns nothing when the user has no saved filters", () => {
    expect(buildEvAlertCandidates([makeOpportunity()], [])).toEqual([]);
  });

  it("includes an opportunity matching ANY saved filter", () => {
    const opportunity = makeOpportunity();
    const result = buildEvAlertCandidates(
      [opportunity],
      [{ sport: "Basketball" }, { minEv: 5 }]
    );
    expect(result).toHaveLength(1);
    expect(result[0].opportunityType).toBe("ev");
    expect(result[0].marketId).toBe(opportunity.market.id);
  });

  it("excludes opportunities matching no saved filter", () => {
    const opportunity = makeOpportunity({ evPercent: 1 });
    const result = buildEvAlertCandidates([opportunity], [{ minEv: 5 }]);
    expect(result).toHaveLength(0);
  });
});

describe("shouldSendAlert / filterNewAlertCandidates (dedup)", () => {
  const candidate: AlertCandidate = {
    opportunityType: "ev",
    marketId: "mkt-1",
    sportsbookSlug: "draftkings",
    side: "A",
    evPercent: 9.2,
    eventLabel: "Away @ Home",
    sideLabel: "Home ML",
  };
  const now = Date.now();
  const cooldownMs = 30 * 60 * 1000;

  it("sends when there is no prior alert for this market/book/side", () => {
    expect(shouldSendAlert(candidate, [], now, cooldownMs)).toBe(true);
  });

  it("suppresses re-sending within the cooldown window, even with different EV%", () => {
    const recentAlerts: SentAlert[] = [
      { marketId: "mkt-1", sportsbookSlug: "draftkings", side: "A", sentAt: new Date(now - 60_000).toISOString() },
    ];
    expect(shouldSendAlert(candidate, recentAlerts, now, cooldownMs)).toBe(false);
  });

  it("allows re-sending once the cooldown window has fully elapsed", () => {
    const recentAlerts: SentAlert[] = [
      { marketId: "mkt-1", sportsbookSlug: "draftkings", side: "A", sentAt: new Date(now - cooldownMs - 1_000).toISOString() },
    ];
    expect(shouldSendAlert(candidate, recentAlerts, now, cooldownMs)).toBe(true);
  });

  it("does not suppress a different market/book/side", () => {
    const recentAlerts: SentAlert[] = [
      { marketId: "mkt-2", sportsbookSlug: "fanduel", side: "B", sentAt: new Date(now - 60_000).toISOString() },
    ];
    expect(shouldSendAlert(candidate, recentAlerts, now, cooldownMs)).toBe(true);
  });

  it("filterNewAlertCandidates keeps only non-suppressed candidates", () => {
    const other: AlertCandidate = { ...candidate, marketId: "mkt-2" };
    const recentAlerts: SentAlert[] = [
      { marketId: "mkt-1", sportsbookSlug: "draftkings", side: "A", sentAt: new Date(now - 60_000).toISOString() },
    ];
    const result = filterNewAlertCandidates([candidate, other], recentAlerts, now, cooldownMs);
    expect(result).toEqual([other]);
  });
});

describe("buildArbitrageAlertCandidates / buildMiddleAlertCandidates", () => {
  it("maps an arbitrage opportunity into an alert candidate", () => {
    const arb: ArbitrageOpportunity = {
      id: "arb-1",
      event: makeOpportunity().event,
      market: makeOpportunity().market,
      sideA: {
        sportsbook: { id: "dk", name: "DraftKings", slug: "draftkings", logoUrl: null, isSharpReference: false },
        side: "A",
        sideLabel: "Home ML",
        oddsDecimal: 2.2,
        stakePercent: 55,
      },
      sideB: {
        sportsbook: { id: "fd", name: "FanDuel", slug: "fanduel", logoUrl: null, isSharpReference: false },
        side: "B",
        sideLabel: "Away ML",
        oddsDecimal: 2.3,
        stakePercent: 45,
      },
      profitPercent: 2.5,
    };
    const result = buildArbitrageAlertCandidates([arb]);
    expect(result).toHaveLength(1);
    expect(result[0].opportunityType).toBe("arbitrage");
    expect(result[0].evPercent).toBe(2.5);
  });

  it("maps a middle opportunity into an alert candidate", () => {
    const middle: MiddleOpportunity = {
      id: "mid-1",
      event: makeOpportunity().event,
      marketType: "total",
      windowLow: 46,
      windowHigh: 48,
      overLeg: {
        sportsbook: { id: "dk", name: "DraftKings", slug: "draftkings", logoUrl: null, isSharpReference: false },
        sideLabel: "Over 46",
        oddsDecimal: 1.95,
        lineValue: 46,
        stakePercent: 50,
      },
      underLeg: {
        sportsbook: { id: "fd", name: "FanDuel", slug: "fanduel", logoUrl: null, isSharpReference: false },
        sideLabel: "Under 48",
        oddsDecimal: 1.95,
        lineValue: 48,
        stakePercent: 50,
      },
      bothWinProfitPercent: 3.1,
      singleWinProfitPercent: -2,
    };
    const result = buildMiddleAlertCandidates([middle]);
    expect(result).toHaveLength(1);
    expect(result[0].opportunityType).toBe("middle");
    expect(result[0].evPercent).toBe(3.1);
  });
});
