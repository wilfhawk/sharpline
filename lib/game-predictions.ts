import { computeAllOpportunities } from "./opportunities";
import type { OddsProviderData } from "./odds-provider";
import { attachPredictions, shapeForTier, type PredictedOpportunity } from "./predictions";
import type {
  DevigMethod,
  EvOpportunity,
  EventSummary,
  MarketSide,
  MarketType,
  SubscriptionTier,
} from "./types";

export interface GameSidePrediction {
  side: MarketSide;
  sideLabel: string;
  /** Best-priced offer for this side; null when the market has no fair-odds benchmark. Shaped for the viewer's tier. */
  pick: EvOpportunity | null;
  /** False when `pick` is from a book outside the viewer's selection (none of their books quote it). */
  atYourBooks: boolean;
}

export interface GameMarketPrediction {
  marketId: string;
  marketType: MarketType;
  sideALabel: string;
  sideBLabel: string;
  sides: GameSidePrediction[];
}

export interface GamePredictionView {
  event: EventSummary;
  markets: GameMarketPrediction[];
}

const MARKET_ORDER: MarketType[] = ["moneyline", "spread", "total", "player_prop"];

function best(candidates: PredictedOpportunity[]): PredictedOpportunity | null {
  return candidates.reduce<PredictedOpportunity | null>((top, o) => (!top || o.evPercent > top.evPercent ? o : top), null);
}

/** Every market of one game with a model prediction per side, whether or not any price is +EV. */
export function buildGamePredictions(
  data: OddsProviderData,
  eventId: string,
  options: { tier: SubscriptionTier; method?: DevigMethod; bookSlugs?: string[] | null; now?: number }
): GamePredictionView | null {
  const event = data.events.find((candidate) => candidate.id === eventId);
  if (!event) return null;
  const method = options.method ?? "multiplicative";
  const gameMarkets = data.markets.filter((market) => market.event.id === eventId);
  const marketIds = new Set(gameMarkets.map((market) => market.id));

  const opportunities = computeAllOpportunities(data, method).filter((o) => marketIds.has(o.market.id));
  const predicted = attachPredictions(data, opportunities, method, options.now);
  const bookSlugs = options.bookSlugs?.length ? options.bookSlugs : null;

  const markets = gameMarkets
    .map((market): GameMarketPrediction => {
      const sides = (["A", "B"] as const).map((side): GameSidePrediction => {
        const forSide = predicted.filter((o) => o.market.id === market.id && o.side === side);
        const atBooks = bookSlugs ? forSide.filter((o) => bookSlugs.includes(o.sportsbook.slug)) : forSide;
        const atYourBooks = atBooks.length > 0;
        const pick = best(atYourBooks ? atBooks : forSide);
        return {
          side,
          sideLabel: side === "A" ? market.sideALabel : market.sideBLabel,
          pick: pick && options.tier !== "free" ? shapeForTier([pick], options.tier)[0] : null,
          atYourBooks: bookSlugs ? atYourBooks : true,
        };
      });
      return { marketId: market.id, marketType: market.marketType, sideALabel: market.sideALabel, sideBLabel: market.sideBLabel, sides };
    })
    .sort((a, b) => MARKET_ORDER.indexOf(a.marketType) - MARKET_ORDER.indexOf(b.marketType));

  return { event, markets };
}
