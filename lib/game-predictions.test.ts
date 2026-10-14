import { describe, expect, it } from "vitest";
import { americanToDecimal } from "./odds-utils";
import type { OddsProviderData } from "./odds-provider";
import { buildGamePredictions } from "./game-predictions";

const NOW = Date.parse("2026-10-14T12:00:00Z");

function fixture(): OddsProviderData {
  const event = { id: "evt-1", sport: "Football", league: "NFL", homeTeam: "Home", awayTeam: "Away", startTime: new Date(NOW + 4 * 3_600_000).toISOString(), status: "upcoming" as const };
  const other = { ...event, id: "evt-2" };
  const ml = { id: "ml-1", event, marketType: "moneyline" as const, lineValue: null, sideALabel: "Home ML", sideBLabel: "Away ML" };
  const total = { id: "tot-1", event, marketType: "total" as const, lineValue: 45.5, sideALabel: "Over 45.5", sideBLabel: "Under 45.5" };
  const unrelated = { id: "ml-2", event: other, marketType: "moneyline" as const, lineValue: null, sideALabel: "X ML", sideBLabel: "Y ML" };
  const timestamp = new Date(NOW).toISOString();
  const quote = (marketId: string, sportsbookId: string, a: number, b: number) => ({ marketId, sportsbookId, oddsDecimalA: americanToDecimal(a), oddsDecimalB: americanToDecimal(b), timestamp });
  return {
    events: [event, other],
    markets: [ml, total, unrelated],
    sportsbooks: [
      { id: "pin", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true },
      { id: "dk", name: "DraftKings", slug: "draftkings", logoUrl: null, isSharpReference: false },
      { id: "fd", name: "FanDuel", slug: "fanduel", logoUrl: null, isSharpReference: false },
    ],
    quotes: [
      quote("ml-1", "pin", -110, -110), quote("ml-1", "dk", 105, -125), quote("ml-1", "fd", -115, -105),
      // Total has no sharp quote, so no benchmark.
      quote("tot-1", "dk", -110, -110), quote("tot-1", "fd", -110, -110),
      quote("ml-2", "pin", -110, -110), quote("ml-2", "dk", 100, -120),
    ],
  };
}

describe("buildGamePredictions", () => {
  it("returns null for an unknown game", () => {
    expect(buildGamePredictions(fixture(), "nope", { tier: "pro" })).toBeNull();
  });

  it("covers every market of only that game, including negative-EV sides", () => {
    const view = buildGamePredictions(fixture(), "evt-1", { tier: "pro", now: NOW })!;
    expect(view.markets.map((m) => m.marketId)).toEqual(["ml-1", "tot-1"]);
    const moneyline = view.markets[0];
    expect(moneyline.sides.every((s) => s.pick !== null)).toBe(true);
    expect(moneyline.sides.some((s) => (s.pick?.evPercent ?? 0) < 0)).toBe(true);
    expect(moneyline.sides[0].pick?.prediction?.modelProbability).toBeDefined();
  });

  it("marks markets without a benchmark as having no pick", () => {
    const view = buildGamePredictions(fixture(), "evt-1", { tier: "pro", now: NOW })!;
    expect(view.markets[1].sides.every((s) => s.pick === null)).toBe(true);
  });

  it("restricts to the selected books and flags when none quote the side", () => {
    const view = buildGamePredictions(fixture(), "evt-1", { tier: "plus", bookSlugs: ["fanduel"], now: NOW })!;
    const sideA = view.markets[0].sides[0];
    expect(sideA.pick?.sportsbook.slug).toBe("fanduel");
    expect(sideA.atYourBooks).toBe(true);

    const none = buildGamePredictions(fixture(), "evt-1", { tier: "plus", bookSlugs: ["betmgm"], now: NOW })!;
    expect(none.markets[0].sides[0].atYourBooks).toBe(false);
    expect(none.markets[0].sides[0].pick).not.toBeNull();
  });

  it("shapes output by tier", () => {
    const plus = buildGamePredictions(fixture(), "evt-1", { tier: "plus", now: NOW })!.markets[0].sides[0].pick;
    expect(plus?.prediction?.agreement).toBeDefined();
    expect(plus?.prediction?.modelProbability).toBeUndefined();
    const free = buildGamePredictions(fixture(), "evt-1", { tier: "free", now: NOW })!;
    expect(free.markets.every((m) => m.sides.every((s) => s.pick === null))).toBe(true);
  });
});
