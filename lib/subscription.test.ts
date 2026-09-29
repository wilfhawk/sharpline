import { describe, expect, it } from "vitest";
import { applyTierGating, getTierLimits } from "./subscription";
import type { EvOpportunity } from "./types";

function makeOpportunity(
  id: string,
  evPercent: number,
  minutesAgo: number
): EvOpportunity {
  const event = {
    id: "evt",
    sport: "Football",
    league: "NFL",
    homeTeam: "Home",
    awayTeam: "Away",
    startTime: new Date().toISOString(),
    status: "upcoming" as const,
  };
  const market = {
    id: "mkt",
    event,
    marketType: "moneyline" as const,
    lineValue: null,
    sideALabel: "Home ML",
    sideBLabel: "Away ML",
  };
  return {
    id,
    event,
    market,
    sportsbook: {
      id: "sb",
      name: "Book",
      slug: "book",
      logoUrl: null,
      isSharpReference: false,
    },
    side: "A",
    sideLabel: "Home ML",
    oddsDecimal: 2,
    fairOddsDecimal: 1.9,
    fairProbability: 0.55,
    evPercent,
    snapshotTimestamp: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
  };
}

describe("getTierLimits", () => {
  it("gives free tier a 15 min delay and a 3/day cap", () => {
    expect(getTierLimits("free")).toEqual({
      dataDelayMinutes: 15,
      maxOpportunitiesPerDay: 3,
    });
  });

  it("gives pro tier no delay and no cap", () => {
    expect(getTierLimits("pro")).toEqual({
      dataDelayMinutes: 0,
      maxOpportunitiesPerDay: null,
    });
  });
});

describe("applyTierGating", () => {
  const opportunities = [
    makeOpportunity("fresh-1", 9, 1),
    makeOpportunity("fresh-2", 8, 2),
    makeOpportunity("stale-1", 7, 20),
    makeOpportunity("stale-2", 6, 25),
    makeOpportunity("stale-3", 5, 30),
    makeOpportunity("stale-4", 4, 40),
  ];

  it("free tier only sees snapshots older than the delay window, capped at 3", () => {
    const result = applyTierGating(opportunities, "free");
    expect(result.map((o) => o.id)).toEqual(["stale-1", "stale-2", "stale-3"]);
  });

  it("pro tier sees everything, unfiltered and uncapped", () => {
    const result = applyTierGating(opportunities, "pro");
    expect(result).toHaveLength(opportunities.length);
  });
});
