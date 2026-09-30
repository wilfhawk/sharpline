import type { OddsProvider, OddsProviderData } from "../odds-provider";
import type { EventSummary, EventStatus, MarketType, OddsQuote, Sportsbook, TwoWayMarket } from "../types";

export interface RawOddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface RawOddsApiMarket {
  key: "h2h" | "spreads" | "totals" | string;
  last_update?: string;
  outcomes: RawOddsApiOutcome[];
}

export interface RawOddsApiBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets: RawOddsApiMarket[];
}

/** One event as returned by GET /v4/sports/{sport}/odds on The Odds API. */
export interface RawOddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: RawOddsApiBookmaker[];
}

/** The Odds API bookmaker key used as Pinnacle's sharp reference (available in the "eu" region). */
const SHARP_REFERENCE_KEY = "pinnacle";

/** Broad sport-family label derived from the sport_key prefix (e.g. "americanfootball_nfl" -> "Football"). */
const SPORT_FAMILY_LABELS: Record<string, string> = {
  americanfootball: "Football",
  basketball: "Basketball",
  baseball: "Baseball",
  icehockey: "Hockey",
  soccer: "Soccer",
  mma: "MMA",
  boxing: "Boxing",
};

function deriveSportFamily(sportKey: string): string {
  const prefix = sportKey.split("_")[0];
  return SPORT_FAMILY_LABELS[prefix] ?? prefix;
}

function deriveStatus(commenceTime: string): EventStatus {
  return new Date(commenceTime).getTime() > Date.now() ? "upcoming" : "live";
}

function formatSignedPoint(point: number): string {
  return point > 0 ? `+${point}` : String(point);
}

function mapEvent(raw: RawOddsApiEvent): EventSummary {
  return {
    id: raw.id,
    sport: deriveSportFamily(raw.sport_key),
    league: raw.sport_title,
    homeTeam: raw.home_team,
    awayTeam: raw.away_team,
    startTime: raw.commence_time,
    status: deriveStatus(raw.commence_time),
  };
}

interface MarketBuildResult {
  marketType: MarketType;
  lineValue: number | null;
  sideALabel: string;
  sideBLabel: string;
  sideAOutcome: RawOddsApiOutcome;
  sideBOutcome: RawOddsApiOutcome;
  /** Distinguishes multiple lines for the same event+marketType (e.g. different spread points). */
  lineKey: string;
}

/** Builds the two-way market shape for one bookmaker's market entry, or null if unsupported/not two-way. */
function buildMarket(
  raw: RawOddsApiMarket,
  event: RawOddsApiEvent
): MarketBuildResult | null {
  if (raw.outcomes.length !== 2) return null; // e.g. skip 3-way soccer h2h with a draw

  if (raw.key === "h2h") {
    const sideAOutcome = raw.outcomes.find((o) => o.name === event.home_team);
    const sideBOutcome = raw.outcomes.find((o) => o.name === event.away_team);
    if (!sideAOutcome || !sideBOutcome) return null;
    return {
      marketType: "moneyline",
      lineValue: null,
      sideALabel: `${event.home_team} ML`,
      sideBLabel: `${event.away_team} ML`,
      sideAOutcome,
      sideBOutcome,
      lineKey: "ml",
    };
  }

  if (raw.key === "spreads") {
    const sideAOutcome = raw.outcomes.find((o) => o.name === event.home_team);
    const sideBOutcome = raw.outcomes.find((o) => o.name === event.away_team);
    if (!sideAOutcome || !sideBOutcome) return null;
    if (sideAOutcome.point === undefined || sideBOutcome.point === undefined) return null;
    return {
      marketType: "spread",
      lineValue: sideAOutcome.point,
      sideALabel: `${event.home_team} ${formatSignedPoint(sideAOutcome.point)}`,
      sideBLabel: `${event.away_team} ${formatSignedPoint(sideBOutcome.point)}`,
      sideAOutcome,
      sideBOutcome,
      lineKey: `spread:${sideAOutcome.point}`,
    };
  }

  if (raw.key === "totals") {
    const sideAOutcome = raw.outcomes.find((o) => o.name.toLowerCase() === "over");
    const sideBOutcome = raw.outcomes.find((o) => o.name.toLowerCase() === "under");
    if (!sideAOutcome || !sideBOutcome) return null;
    if (sideAOutcome.point === undefined) return null;
    return {
      marketType: "total",
      lineValue: sideAOutcome.point,
      sideALabel: `Over ${sideAOutcome.point}`,
      sideBLabel: `Under ${sideAOutcome.point}`,
      sideAOutcome,
      sideBOutcome,
      lineKey: `total:${sideAOutcome.point}`,
    };
  }

  return null;
}

/**
 * Maps raw The Odds API events into this app's OddsProviderData shape.
 * Pure/hermetic: no network calls, safe to unit test with fixture data.
 */
export function mapTheOddsApiEvents(rawEvents: RawOddsApiEvent[]): OddsProviderData {
  const sportsbookByKey = new Map<string, Sportsbook>();
  const events: EventSummary[] = [];
  const marketByLineKey = new Map<string, TwoWayMarket>();
  const quotes: OddsQuote[] = [];

  for (const rawEvent of rawEvents) {
    const event = mapEvent(rawEvent);
    events.push(event);

    for (const bookmaker of rawEvent.bookmakers) {
      if (!sportsbookByKey.has(bookmaker.key)) {
        sportsbookByKey.set(bookmaker.key, {
          id: bookmaker.key,
          name: bookmaker.title,
          slug: bookmaker.key,
          logoUrl: null,
          isSharpReference: bookmaker.key === SHARP_REFERENCE_KEY,
        });
      }

      for (const rawMarket of bookmaker.markets) {
        const built = buildMarket(rawMarket, rawEvent);
        if (!built) continue;

        const marketId = `${rawEvent.id}:${built.lineKey}`;
        let market = marketByLineKey.get(marketId);
        if (!market) {
          market = {
            id: marketId,
            event,
            marketType: built.marketType,
            lineValue: built.lineValue,
            sideALabel: built.sideALabel,
            sideBLabel: built.sideBLabel,
          };
          marketByLineKey.set(marketId, market);
        }

        quotes.push({
          marketId,
          sportsbookId: bookmaker.key,
          oddsDecimalA: built.sideAOutcome.price,
          oddsDecimalB: built.sideBOutcome.price,
          timestamp:
            rawMarket.last_update ?? bookmaker.last_update ?? new Date().toISOString(),
        });
      }
    }
  }

  return {
    sportsbooks: [...sportsbookByKey.values()],
    events,
    markets: [...marketByLineKey.values()],
    quotes,
  };
}

export interface TheOddsApiConfig {
  apiKey: string;
  sportKeys: string[];
  regions: string;
  baseUrl: string;
  /** How long Next.js may serve a cached response before re-fetching, protecting the API quota. */
  cacheSeconds: number;
}

/** Real odds provider backed by The Odds API (https://the-odds-api.com). */
export class TheOddsApiProvider implements OddsProvider {
  readonly name = "the-odds-api";
  readonly isMock = false;

  constructor(private readonly config: TheOddsApiConfig) {}

  async fetchData(): Promise<OddsProviderData> {
    const perSport = await Promise.all(
      this.config.sportKeys.map((sportKey) => this.fetchSportEvents(sportKey))
    );
    return mapTheOddsApiEvents(perSport.flat());
  }

  private async fetchSportEvents(sportKey: string): Promise<RawOddsApiEvent[]> {
    const url = new URL(`${this.config.baseUrl}/sports/${sportKey}/odds/`);
    url.searchParams.set("apiKey", this.config.apiKey);
    url.searchParams.set("regions", this.config.regions);
    url.searchParams.set("markets", "h2h,spreads,totals");
    url.searchParams.set("oddsFormat", "decimal");
    url.searchParams.set("dateFormat", "iso");

    const response = await fetch(url.toString(), {
      next: { revalidate: this.config.cacheSeconds },
    });

    if (!response.ok) {
      throw new Error(
        `The Odds API request failed for sport "${sportKey}": ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }
}
