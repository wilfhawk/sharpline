import type { OddsProviderData } from "./odds-provider";
import type { EventSummary, TwoWayMarket } from "./types";

export interface CatalogGame extends EventSummary {
  markets: Pick<TwoWayMarket, "id" | "marketType" | "sideALabel" | "sideBLabel">[];
}

export function buildGameCatalog(data: OddsProviderData): CatalogGame[] {
  return data.events.map((event) => ({
    ...event,
    markets: data.markets.filter((market) => market.event.id === event.id).map(({ id, marketType, sideALabel, sideBLabel }) => ({ id, marketType, sideALabel, sideBLabel })),
  })).sort((first, second) => Date.parse(first.startTime) - Date.parse(second.startTime));
}