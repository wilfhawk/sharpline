import { expect, it } from "vitest";
import { buildGameCatalog } from "./game-catalog";
import { buildMockOddsProviderData } from "./mock-data";

it("includes games without quotes or a sharp benchmark and never exposes prices", () => {
  const data = buildMockOddsProviderData();
  data.quotes = [];
  const games = buildGameCatalog(data);
  expect(games).toHaveLength(data.events.length);
  expect(JSON.stringify(games)).not.toContain("oddsDecimal");
  expect(games.some((game) => game.markets.length > 0)).toBe(true);
});