export type MarketType = "moneyline" | "spread" | "total" | "player_prop";
export type EventStatus = "upcoming" | "live" | "final";
export type SubscriptionTier = "free" | "pro";
export type DevigMethod = "multiplicative" | "power";

export interface Sportsbook {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  /** True for the sharp reference book (Pinnacle) used to derive fair odds. */
  isSharpReference: boolean;
}

export interface EventSummary {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601
  status: EventStatus;
}

/** A two-way (side A vs side B) bettable line, e.g. moneyline, a spread, or a total. */
export interface TwoWayMarket {
  id: string;
  event: EventSummary;
  marketType: MarketType;
  lineValue: number | null; // null for moneyline
  sideALabel: string; // e.g. "Lakers ML", "Lakers -5.5", "Over 220.5"
  sideBLabel: string; // e.g. "Warriors ML", "Warriors +5.5", "Under 220.5"
}

/** One sportsbook's current decimal odds for both sides of a market at a point in time. */
export interface OddsQuote {
  marketId: string;
  sportsbookId: string;
  oddsDecimalA: number;
  oddsDecimalB: number;
  timestamp: string; // ISO 8601
}

export type MarketSide = "A" | "B";

/** A ranked +EV opportunity: one book, one side, one market, compared to Pinnacle fair odds. */
export interface EvOpportunity {
  id: string;
  event: EventSummary;
  market: TwoWayMarket;
  sportsbook: Sportsbook;
  side: MarketSide;
  sideLabel: string;
  oddsDecimal: number;
  fairOddsDecimal: number;
  fairProbability: number;
  evPercent: number;
  snapshotTimestamp: string;
}

/** All tracked books' current price for one exact market side, for the expanded row view. */
export interface BookComparisonRow {
  sportsbook: Sportsbook;
  side: MarketSide;
  sideLabel: string;
  oddsDecimal: number;
  evPercent: number | null; // null when this book has no fair-odds reference (e.g. is Pinnacle itself)
}
