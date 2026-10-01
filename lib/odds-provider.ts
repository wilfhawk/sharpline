import type { EventSummary, OddsQuote, Sportsbook, TwoWayMarket } from "./types";
import { MockOddsProvider } from "./providers/mock-provider";
import { TheOddsApiProvider } from "./providers/the-odds-api-provider";

export interface OddsProviderData {
  sportsbooks: Sportsbook[];
  events: EventSummary[];
  markets: TwoWayMarket[];
  quotes: OddsQuote[];
}

/** Abstracts away the odds data source so real providers can swap in without UI/engine changes. */
export interface OddsProvider {
  readonly name: string;
  /** True when this provider is a placeholder/sample source (drives the "mock data" UI banner). */
  readonly isMock: boolean;
  fetchData(): Promise<OddsProviderData>;
}

/**
 * Factory: selects the active provider via ODDS_PROVIDER env var.
 * "mock" (default) and "the-odds-api" (https://the-odds-api.com) are implemented;
 * add a new OddsProvider implementation for other sources without touching callers.
 */
export function getOddsProvider(): OddsProvider {
  const providerName = process.env.ODDS_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      return createMockProviderSingleton();
    case "the-odds-api": {
      const apiKey = process.env.ODDS_API_KEY;
      if (!apiKey) {
        throw new Error(
          'ODDS_PROVIDER="the-odds-api" requires ODDS_API_KEY to be set (get a free key at https://the-odds-api.com).'
        );
      }
      return new TheOddsApiProvider({
        apiKey,
        sportKeys: (process.env.ODDS_API_SPORTS ?? "americanfootball_nfl,basketball_nba")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        regions: process.env.ODDS_API_REGIONS ?? "us,eu",
        baseUrl: process.env.ODDS_API_BASE_URL ?? "https://api.the-odds-api.com/v4",
        cacheSeconds: Number(process.env.ODDS_API_CACHE_SECONDS ?? 60),
        extraMarkets: (process.env.ODDS_API_EXTRA_MARKETS ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sharpBookKeys: (process.env.ODDS_API_SHARP_BOOKS ?? "pinnacle")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
    default:
      throw new Error(
        `Unknown ODDS_PROVIDER "${providerName}". Supported values: "mock", "the-odds-api".`
      );
  }
}

let mockProviderSingleton: OddsProvider | undefined;

function createMockProviderSingleton(): OddsProvider {
  if (!mockProviderSingleton) {
    mockProviderSingleton = new MockOddsProvider();
  }
  return mockProviderSingleton;
}
