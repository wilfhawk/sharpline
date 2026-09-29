import type { EventSummary, OddsQuote, Sportsbook, TwoWayMarket } from "./types";
import { MockOddsProvider } from "./providers/mock-provider";

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
 * Only "mock" is implemented today; real providers (The Odds API, OpticOdds,
 * SportsGameOdds) plug in here later without touching callers.
 */
export function getOddsProvider(): OddsProvider {
  const providerName = process.env.ODDS_PROVIDER ?? "mock";

  switch (providerName) {
    case "mock":
      return createMockProviderSingleton();
    default:
      throw new Error(
        `Unknown ODDS_PROVIDER "${providerName}". Only "mock" is implemented; ` +
          `add a new OddsProvider implementation before configuring others.`
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
