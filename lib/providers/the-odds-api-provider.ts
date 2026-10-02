import type { OddsProvider, OddsProviderData } from "../odds-provider";
import type { EventSummary, EventStatus, MarketType, OddsQuote, Sportsbook, TwoWayMarket } from "../types";

export interface RawOddsApiOutcome {
  name: string;
  price: number;
  point?: number;
  /** Player name for player-prop markets (e.g. player_points); absent on h2h/spreads/totals. */
  description?: string;
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

/** The Odds API bookmaker key used as Pinnacle's sharp reference (available in the "eu" region) — overridable via sharpBookKeys below for multi-sharp-book fallback. */
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

/** e.g. "player_pass_tds" -> "Pass Tds", "player_points" -> "Points". */
function humanizePropMarketKey(marketKey: string): string {
  return marketKey
    .replace(/^player_/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
 * Builds one result per player+line for a player-prop market (e.g. "player_points"),
 * which packs every player's Over/Under outcomes into a single raw market entry
 * distinguished only by `description` (the player name). Unlike h2h/spreads/totals,
 * one rawMarket can yield many two-way markets here.
 */
function buildPlayerPropMarkets(
  raw: RawOddsApiMarket
): MarketBuildResult[] {
  const groups = new Map<string, RawOddsApiOutcome[]>();
  for (const outcome of raw.outcomes) {
    if (!outcome.description || outcome.point === undefined) continue;
    const groupKey = `${outcome.description}|${outcome.point}`;
    const group = groups.get(groupKey);
    if (group) group.push(outcome);
    else groups.set(groupKey, [outcome]);
  }

  const propLabel = humanizePropMarketKey(raw.key);
  const results: MarketBuildResult[] = [];

  for (const outcomes of groups.values()) {
    if (outcomes.length !== 2) continue;
    const sideAOutcome = outcomes.find((o) => o.name.toLowerCase() === "over");
    const sideBOutcome = outcomes.find((o) => o.name.toLowerCase() === "under");
    if (!sideAOutcome || !sideBOutcome) continue;

    const player = sideAOutcome.description!;
    const point = sideAOutcome.point!;
    results.push({
      marketType: "player_prop",
      lineValue: point,
      sideALabel: `${player} Over ${point} ${propLabel}`,
      sideBLabel: `${player} Under ${point} ${propLabel}`,
      sideAOutcome,
      sideBOutcome,
      lineKey: `prop:${raw.key}:${player}:${point}`,
    });
  }

  return results;
}

/**
 * Maps raw The Odds API events into this app's OddsProviderData shape.
 * `sharpBookKeys` is a priority-ordered list of bookmaker keys to treat as
 * sharp reference books (index = priority, e.g. ["pinnacle","circasports",
 * "betonlineag"] falls back to Circa then BetOnline when Pinnacle hasn't
 * posted a line). Defaults to Pinnacle only for backward compatibility.
 * Pure/hermetic: no network calls, safe to unit test with fixture data.
 */
export function mapTheOddsApiEvents(
  rawEvents: RawOddsApiEvent[],
  sharpBookKeys: string[] = [SHARP_REFERENCE_KEY]
): OddsProviderData {
  const sportsbookByKey = new Map<string, Sportsbook>();
  const events: EventSummary[] = [];
  const marketByLineKey = new Map<string, TwoWayMarket>();
  const quotes: OddsQuote[] = [];

  for (const rawEvent of rawEvents) {
    const event = mapEvent(rawEvent);
    events.push(event);

    for (const bookmaker of rawEvent.bookmakers) {
      if (!sportsbookByKey.has(bookmaker.key)) {
        const sharpPriority = sharpBookKeys.indexOf(bookmaker.key);
        sportsbookByKey.set(bookmaker.key, {
          id: bookmaker.key,
          name: bookmaker.title,
          slug: bookmaker.key,
          logoUrl: null,
          isSharpReference: sharpPriority !== -1,
          sharpPriority: sharpPriority !== -1 ? sharpPriority : null,
        });
      }

      for (const rawMarket of bookmaker.markets) {
        const isFeaturedMarket =
          rawMarket.key === "h2h" || rawMarket.key === "spreads" || rawMarket.key === "totals";
        const built = isFeaturedMarket
          ? [buildMarket(rawMarket, rawEvent)].filter((m): m is MarketBuildResult => m !== null)
          : buildPlayerPropMarkets(rawMarket);

        for (const result of built) {
          const marketId = `${rawEvent.id}:${result.lineKey}`;
          let market = marketByLineKey.get(marketId);
          if (!market) {
            market = {
              id: marketId,
              event,
              marketType: result.marketType,
              lineValue: result.lineValue,
              sideALabel: result.sideALabel,
              sideBLabel: result.sideBLabel,
            };
            marketByLineKey.set(marketId, market);
          }

          quotes.push({
            marketId,
            sportsbookId: bookmaker.key,
            oddsDecimalA: result.sideAOutcome.price,
            oddsDecimalB: result.sideBOutcome.price,
            timestamp:
              rawMarket.last_update ?? bookmaker.last_update ?? new Date().toISOString(),
          });
        }
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
  /** Opt-in player-prop market keys (e.g. "player_points") added to the same bulk /odds call. Each adds to the per-refresh credit cost (markets x regions) — off by default. */
  extraMarkets: string[];
  /** Priority-ordered bookmaker keys treated as sharp reference books (index = priority). Defaults to ["pinnacle"]. */
  sharpBookKeys: string[];
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
    return mapTheOddsApiEvents(perSport.flat(), this.config.sharpBookKeys);
  }

  private async fetchSportEvents(sportKey: string): Promise<RawOddsApiEvent[]> {
    const url = new URL(`${this.config.baseUrl}/sports/${sportKey}/odds/`);
    url.searchParams.set("apiKey", this.config.apiKey);
    url.searchParams.set("regions", this.config.regions);
    url.searchParams.set("markets", ["h2h", "spreads", "totals", ...this.config.extraMarkets].join(","));
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
