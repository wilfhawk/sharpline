import { describe, expect, it } from "vitest";
import { usableFeed } from "./feed-quality";
import { buildMockOddsProviderData } from "./mock-data";

describe("feed quality", () => {
  it("rejects stale, future, invalid and nonfinite prices", () => {
    const data = buildMockOddsProviderData();
    const quote = data.quotes[0];
    const now = Date.now();
    data.quotes = [
      { ...quote, timestamp: new Date(now).toISOString() },
      { ...quote, timestamp: new Date(now - 400_000).toISOString() },
      { ...quote, timestamp: new Date(now + 400_000).toISOString() },
      { ...quote, timestamp: "invalid" },
      { ...quote, timestamp: new Date(now).toISOString(), oddsDecimalA: Infinity },
    ];
    expect(usableFeed(data, now).quotes).toHaveLength(1);
    expect(usableFeed(data, now).events).toEqual(data.events);
  });
});