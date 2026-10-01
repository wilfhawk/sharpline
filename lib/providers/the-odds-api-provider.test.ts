import { describe, expect, it } from "vitest";
import { mapTheOddsApiEvents, type RawOddsApiEvent } from "./the-odds-api-provider";

const NFL_EVENT: RawOddsApiEvent = {
  id: "evt-1",
  sport_key: "americanfootball_nfl",
  sport_title: "NFL",
  commence_time: "2099-01-01T18:00:00Z",
  home_team: "Buffalo Bills",
  away_team: "Kansas City Chiefs",
  bookmakers: [
    {
      key: "pinnacle",
      title: "Pinnacle",
      last_update: "2099-01-01T17:00:00Z",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Buffalo Bills", price: 1.87 },
            { name: "Kansas City Chiefs", price: 2.02 },
          ],
        },
        {
          key: "spreads",
          outcomes: [
            { name: "Buffalo Bills", price: 1.91, point: -2.5 },
            { name: "Kansas City Chiefs", price: 1.91, point: 2.5 },
          ],
        },
        {
          key: "totals",
          outcomes: [
            { name: "Over", price: 1.95, point: 47.5 },
            { name: "Under", price: 1.87, point: 47.5 },
          ],
        },
      ],
    },
    {
      key: "draftkings",
      title: "DraftKings",
      last_update: "2099-01-01T17:05:00Z",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Buffalo Bills", price: 1.8 },
            { name: "Kansas City Chiefs", price: 2.1 },
          ],
        },
      ],
    },
  ],
};

const SOCCER_EVENT_WITH_DRAW: RawOddsApiEvent = {
  id: "evt-2",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2099-01-02T15:00:00Z",
  home_team: "Arsenal",
  away_team: "Chelsea",
  bookmakers: [
    {
      key: "pinnacle",
      title: "Pinnacle",
      last_update: "2099-01-02T14:00:00Z",
      markets: [
        {
          key: "h2h",
          outcomes: [
            { name: "Arsenal", price: 2.1 },
            { name: "Draw", price: 3.4 },
            { name: "Chelsea", price: 3.6 },
          ],
        },
      ],
    },
  ],
};

describe("mapTheOddsApiEvents", () => {
  it("maps sportsbooks, marking pinnacle as the sharp reference", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    const pinnacle = data.sportsbooks.find((s) => s.slug === "pinnacle");
    const draftkings = data.sportsbooks.find((s) => s.slug === "draftkings");

    expect(pinnacle?.isSharpReference).toBe(true);
    expect(draftkings?.isSharpReference).toBe(false);
  });

  it("maps the event summary with an upcoming status for a future commence_time", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    expect(data.events).toHaveLength(1);
    expect(data.events[0]).toMatchObject({
      homeTeam: "Buffalo Bills",
      awayTeam: "Kansas City Chiefs",
      league: "NFL",
      status: "upcoming",
    });
  });

  it("maps h2h markets to moneyline with decimal quotes for every book", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    const moneyline = data.markets.find((m) => m.marketType === "moneyline");
    expect(moneyline?.lineValue).toBeNull();

    const quotes = data.quotes.filter((q) => q.marketId === moneyline?.id);
    expect(quotes).toHaveLength(2);

    const pinnacleQuote = quotes.find((q) => q.sportsbookId === "pinnacle");
    expect(pinnacleQuote?.oddsDecimalA).toBeCloseTo(1.87);
    expect(pinnacleQuote?.oddsDecimalB).toBeCloseTo(2.02);
  });

  it("maps spreads to a spread market keyed by the home team's point", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    const spread = data.markets.find((m) => m.marketType === "spread");
    expect(spread).toMatchObject({
      lineValue: -2.5,
      sideALabel: "Buffalo Bills -2.5",
      sideBLabel: "Kansas City Chiefs +2.5",
    });
  });

  it("maps totals to a total market with Over/Under side labels", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    const total = data.markets.find((m) => m.marketType === "total");
    expect(total).toMatchObject({
      lineValue: 47.5,
      sideALabel: "Over 47.5",
      sideBLabel: "Under 47.5",
    });

    const quote = data.quotes.find(
      (q) => q.marketId === total?.id && q.sportsbookId === "pinnacle"
    );
    expect(quote?.oddsDecimalA).toBeCloseTo(1.95);
    expect(quote?.oddsDecimalB).toBeCloseTo(1.87);
  });

  it("skips three-way h2h markets (e.g. soccer with a draw) since they aren't two-way", () => {
    const data = mapTheOddsApiEvents([SOCCER_EVENT_WITH_DRAW]);
    expect(data.markets).toHaveLength(0);
    expect(data.quotes).toHaveLength(0);
  });

  it("maps a player-prop market into one two-way market per player, grouped by description+point", () => {
    const eventWithProps: RawOddsApiEvent = {
      ...NFL_EVENT,
      bookmakers: [
        {
          key: "draftkings",
          title: "DraftKings",
          last_update: "2099-01-01T17:05:00Z",
          markets: [
            {
              key: "player_pass_tds",
              outcomes: [
                { name: "Over", description: "Josh Allen", price: 1.9, point: 2.5 },
                { name: "Under", description: "Josh Allen", price: 1.9, point: 2.5 },
                { name: "Over", description: "Patrick Mahomes", price: 1.8, point: 1.5 },
                { name: "Under", description: "Patrick Mahomes", price: 2.0, point: 1.5 },
              ],
            },
          ],
        },
      ],
    };

    const data = mapTheOddsApiEvents([eventWithProps]);
    const propMarkets = data.markets.filter((m) => m.marketType === "player_prop");
    expect(propMarkets).toHaveLength(2);

    const allen = propMarkets.find((m) => m.sideALabel.includes("Josh Allen"));
    expect(allen).toMatchObject({
      lineValue: 2.5,
      sideALabel: "Josh Allen Over 2.5 Pass Tds",
      sideBLabel: "Josh Allen Under 2.5 Pass Tds",
    });

    const allenQuote = data.quotes.find((q) => q.marketId === allen?.id);
    expect(allenQuote?.oddsDecimalA).toBeCloseTo(1.9);
    expect(allenQuote?.oddsDecimalB).toBeCloseTo(1.9);
  });

  it("marks multiple sharp reference books with priority = index in sharpBookKeys", () => {
    const eventWithCirca: RawOddsApiEvent = {
      ...NFL_EVENT,
      bookmakers: [
        ...NFL_EVENT.bookmakers,
        {
          key: "circasports",
          title: "Circa Sports",
          last_update: "2099-01-01T17:00:00Z",
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Buffalo Bills", price: 1.88 },
                { name: "Kansas City Chiefs", price: 2.0 },
              ],
            },
          ],
        },
      ],
    };

    const data = mapTheOddsApiEvents([eventWithCirca], ["pinnacle", "circasports", "betonlineag"]);
    const pinnacle = data.sportsbooks.find((s) => s.slug === "pinnacle")!;
    const circa = data.sportsbooks.find((s) => s.slug === "circasports")!;
    const draftkings = data.sportsbooks.find((s) => s.slug === "draftkings")!;

    expect(pinnacle.isSharpReference).toBe(true);
    expect(pinnacle.sharpPriority).toBe(0);
    expect(circa.isSharpReference).toBe(true);
    expect(circa.sharpPriority).toBe(1);
    expect(draftkings.isSharpReference).toBe(false);
    expect(draftkings.sharpPriority).toBeNull();
  });

  it("defaults to pinnacle-only as the sharp reference when sharpBookKeys is omitted", () => {
    const data = mapTheOddsApiEvents([NFL_EVENT]);
    const pinnacle = data.sportsbooks.find((s) => s.slug === "pinnacle")!;
    expect(pinnacle.sharpPriority).toBe(0);
  });
});
