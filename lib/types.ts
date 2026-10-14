export type MarketType = "moneyline" | "spread" | "total" | "player_prop";
export type EventStatus = "upcoming" | "live" | "final";
export type SubscriptionTier = "free" | "plus" | "pro";
export type DevigMethod = "multiplicative" | "power";

export interface Sportsbook {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  /** True for a sharp reference book (e.g. Pinnacle, Circa, BetOnline) used to derive fair odds. */
  isSharpReference: boolean;
  /**
   * Preference order among sharp reference books when more than one quotes a
   * market (lower = more preferred, e.g. Pinnacle=0, Circa=1, BetOnline=2).
   * Undefined/null for non-sharp books.
   */
  sharpPriority?: number | null;
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
  /** Sportsbook betslip/market page for each side, when the feed provides one. */
  linkA?: string;
  linkB?: string;
  timestamp: string; // ISO 8601
}

export type MarketSide = "A" | "B";

export type ModelAgreement = "agrees" | "neutral" | "disagrees";
export type PredictionConfidence = "low" | "medium" | "high";

/** Model view of an opportunity; probability and edge are Pro-only and omitted for Plus. */
export interface OpportunityPrediction {
  modelVersion: string;
  /** Whether the model also sees positive EV at this price. */
  agreement: ModelAgreement;
  confidence: PredictionConfidence;
  modelProbability?: number;
  modelEdgePercent?: number;
}

/** A ranked +EV opportunity: one book, one side, one market, compared to Pinnacle fair odds. */
export interface EvOpportunity {
  referenceBook?: string;
  referenceTimestamp?: string;
  devigMethod?: DevigMethod;
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
  /** Where to place this bet: a feed deep link when available, else the sportsbook's site. */
  betLink?: string;
  /** Present for Plus/Pro responses only. */
  prediction?: OpportunityPrediction;
}

/** All tracked books' current price for one exact market side, for the expanded row view. */
export interface BookComparisonRow {
  sportsbook: Sportsbook;
  side: MarketSide;
  sideLabel: string;
  oddsDecimal: number;
  evPercent: number | null; // null when this book has no fair-odds reference (e.g. is Pinnacle itself)
  betLink?: string;
}
