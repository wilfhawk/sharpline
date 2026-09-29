import { americanToDecimal } from "./odds-utils";
import type { OddsProviderData } from "./odds-provider";
import type {
  EventSummary,
  OddsQuote,
  Sportsbook,
  TwoWayMarket,
} from "./types";

const SPORTSBOOKS: Sportsbook[] = [
  { id: "sb-pinnacle", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true },
  { id: "sb-draftkings", name: "DraftKings", slug: "draftkings", logoUrl: null, isSharpReference: false },
  { id: "sb-fanduel", name: "FanDuel", slug: "fanduel", logoUrl: null, isSharpReference: false },
  { id: "sb-betmgm", name: "BetMGM", slug: "betmgm", logoUrl: null, isSharpReference: false },
  { id: "sb-caesars", name: "Caesars", slug: "caesars", logoUrl: null, isSharpReference: false },
];

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/** Simulates a live feed: each snapshot lands somewhere in the last 0-20 minutes. */
function jitteredRecentTimestamp(): string {
  const minutesAgo = Math.random() * 20;
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
}

interface EventSeed {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startInHours: number;
  status: EventSummary["status"];
}

const EVENT_SEEDS: EventSeed[] = [
  { id: "evt-chiefs-bills", sport: "Football", league: "NFL", homeTeam: "Bills", awayTeam: "Chiefs", startInHours: 3, status: "upcoming" },
  { id: "evt-lakers-warriors", sport: "Basketball", league: "NBA", homeTeam: "Warriors", awayTeam: "Lakers", startInHours: 0.25, status: "live" },
  { id: "evt-eagles-cowboys", sport: "Football", league: "NFL", homeTeam: "Cowboys", awayTeam: "Eagles", startInHours: 27, status: "upcoming" },
  { id: "evt-celtics-bucks", sport: "Basketball", league: "NBA", homeTeam: "Bucks", awayTeam: "Celtics", startInHours: 5.5, status: "upcoming" },
  { id: "evt-49ers-rams", sport: "Football", league: "NFL", homeTeam: "Rams", awayTeam: "49ers", startInHours: 51, status: "upcoming" },
  { id: "evt-nuggets-suns", sport: "Basketball", league: "NBA", homeTeam: "Suns", awayTeam: "Nuggets", startInHours: 8, status: "upcoming" },
];

/** American odds (home, away) per sportsbook, keyed by sportsbook id, for one moneyline market. */
type MoneylineBookOdds = Record<string, [home: number, away: number]>;
/** American odds (over, under) per sportsbook, keyed by sportsbook id, for one total market. */
type TotalBookOdds = Record<string, [over: number, under: number]>;

const MONEYLINE_ODDS: Record<string, MoneylineBookOdds> = {
  "evt-chiefs-bills": {
    "sb-pinnacle": [-130, 115],
    "sb-draftkings": [-125, 105],
    "sb-fanduel": [-140, 120],
    "sb-betmgm": [-128, 110],
    "sb-caesars": [-135, 130],
  },
  "evt-lakers-warriors": {
    "sb-pinnacle": [145, -165],
    "sb-draftkings": [150, -170],
    "sb-fanduel": [160, -175],
    "sb-betmgm": [140, -160],
    "sb-caesars": [155, -180],
  },
  "evt-eagles-cowboys": {
    "sb-pinnacle": [-110, -108],
    "sb-draftkings": [-105, -112],
    "sb-fanduel": [-112, -105],
    "sb-betmgm": [-108, -110],
    "sb-caesars": [-102, -115],
  },
  "evt-celtics-bucks": {
    "sb-pinnacle": [-175, 155],
    "sb-draftkings": [-180, 150],
    "sb-fanduel": [-165, 160],
    "sb-betmgm": [-170, 145],
    "sb-caesars": [-185, 170],
  },
  "evt-49ers-rams": {
    "sb-pinnacle": [-220, 185],
    "sb-draftkings": [-215, 175],
    "sb-fanduel": [-230, 195],
    "sb-betmgm": [-210, 180],
    "sb-caesars": [-225, 200],
  },
  "evt-nuggets-suns": {
    "sb-pinnacle": [-155, 135],
    "sb-draftkings": [-160, 130],
    "sb-fanduel": [-150, 140],
    "sb-betmgm": [-158, 132],
    "sb-caesars": [-145, 145],
  },
};

const TOTAL_LINE_VALUE: Record<string, number> = {
  "evt-chiefs-bills": 47.5,
  "evt-lakers-warriors": 224.5,
  "evt-eagles-cowboys": 44.5,
  "evt-celtics-bucks": 218.5,
  "evt-49ers-rams": 46,
  "evt-nuggets-suns": 231.5,
};

const TOTAL_ODDS: Record<string, TotalBookOdds> = {
  "evt-chiefs-bills": {
    "sb-pinnacle": [-108, -108],
    "sb-draftkings": [-105, -110],
    "sb-fanduel": [-115, -102],
    "sb-betmgm": [-110, -108],
    "sb-caesars": [-100, -118],
  },
  "evt-lakers-warriors": {
    "sb-pinnacle": [-112, -105],
    "sb-draftkings": [-108, -108],
    "sb-fanduel": [-118, -100],
    "sb-betmgm": [-110, -110],
    "sb-caesars": [-104, -114],
  },
  "evt-eagles-cowboys": {
    "sb-pinnacle": [-107, -110],
    "sb-draftkings": [-110, -107],
    "sb-fanduel": [-100, -117],
    "sb-betmgm": [-112, -105],
    "sb-caesars": [-105, -112],
  },
  "evt-celtics-bucks": {
    "sb-pinnacle": [-110, -108],
    "sb-draftkings": [-115, -102],
    "sb-fanduel": [-105, -112],
    "sb-betmgm": [-108, -110],
    "sb-caesars": [-118, -100],
  },
  "evt-49ers-rams": {
    "sb-pinnacle": [-105, -112],
    "sb-draftkings": [-100, -116],
    "sb-fanduel": [-110, -108],
    "sb-betmgm": [-104, -113],
    "sb-caesars": [-108, -110],
  },
  "evt-nuggets-suns": {
    "sb-pinnacle": [-109, -109],
    "sb-draftkings": [-112, -104],
    "sb-fanduel": [-102, -115],
    "sb-betmgm": [-107, -110],
    "sb-caesars": [-113, -101],
  },
};

function buildEvents(): EventSummary[] {
  return EVENT_SEEDS.map((seed) => ({
    id: seed.id,
    sport: seed.sport,
    league: seed.league,
    homeTeam: seed.homeTeam,
    awayTeam: seed.awayTeam,
    startTime: hoursFromNow(seed.startInHours),
    status: seed.status,
  }));
}

function buildMoneylineMarket(seed: EventSeed, event: EventSummary): TwoWayMarket {
  return {
    id: `mkt-${seed.id}-ml`,
    event,
    marketType: "moneyline",
    lineValue: null,
    sideALabel: `${seed.homeTeam} ML`,
    sideBLabel: `${seed.awayTeam} ML`,
  };
}

function buildTotalMarket(seed: EventSeed, event: EventSummary): TwoWayMarket {
  const line = TOTAL_LINE_VALUE[seed.id];
  return {
    id: `mkt-${seed.id}-total`,
    event,
    marketType: "total",
    lineValue: line,
    sideALabel: `Over ${line}`,
    sideBLabel: `Under ${line}`,
  };
}

function buildMoneylineQuotes(seed: EventSeed, marketId: string): OddsQuote[] {
  const bookOdds = MONEYLINE_ODDS[seed.id];
  return Object.entries(bookOdds).map(([sportsbookId, [home, away]]) => ({
    marketId,
    sportsbookId,
    oddsDecimalA: americanToDecimal(home),
    oddsDecimalB: americanToDecimal(away),
    // Pinnacle (the fair-odds reference) always reflects the freshest line.
    timestamp:
      sportsbookId === "sb-pinnacle"
        ? new Date().toISOString()
        : jitteredRecentTimestamp(),
  }));
}

function buildTotalQuotes(seed: EventSeed, marketId: string): OddsQuote[] {
  const bookOdds = TOTAL_ODDS[seed.id];
  return Object.entries(bookOdds).map(([sportsbookId, [over, under]]) => ({
    marketId,
    sportsbookId,
    oddsDecimalA: americanToDecimal(over),
    oddsDecimalB: americanToDecimal(under),
    timestamp:
      sportsbookId === "sb-pinnacle"
        ? new Date().toISOString()
        : jitteredRecentTimestamp(),
  }));
}

/** Builds a fresh mock odds data set with startTime/timestamp relative to "now". */
export function buildMockOddsProviderData(): OddsProviderData {
  const events = buildEvents();
  const eventById = new Map(events.map((e) => [e.id, e]));

  const markets: TwoWayMarket[] = [];
  const quotes: OddsQuote[] = [];

  for (const seed of EVENT_SEEDS) {
    const event = eventById.get(seed.id)!;

    const moneylineMarket = buildMoneylineMarket(seed, event);
    markets.push(moneylineMarket);
    quotes.push(...buildMoneylineQuotes(seed, moneylineMarket.id));

    const totalMarket = buildTotalMarket(seed, event);
    markets.push(totalMarket);
    quotes.push(...buildTotalQuotes(seed, totalMarket.id));
  }

  return { sportsbooks: SPORTSBOOKS, events, markets, quotes };
}
