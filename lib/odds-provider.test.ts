import { afterEach, describe, expect, it } from "vitest";
import { getOddsProvider } from "./odds-provider";

const ORIGINAL_ODDS_PROVIDER = process.env.ODDS_PROVIDER;

afterEach(() => {
  process.env.ODDS_PROVIDER = ORIGINAL_ODDS_PROVIDER;
});

describe("getOddsProvider", () => {
  it("defaults to the mock provider when ODDS_PROVIDER is unset", () => {
    delete process.env.ODDS_PROVIDER;
    const provider = getOddsProvider();
    expect(provider.name).toBe("mock");
    expect(provider.isMock).toBe(true);
  });

  it("returns the mock provider when explicitly configured", () => {
    process.env.ODDS_PROVIDER = "mock";
    expect(getOddsProvider().name).toBe("mock");
  });

  it("throws for an unimplemented provider name", () => {
    process.env.ODDS_PROVIDER = "the-odds-api";
    expect(() => getOddsProvider()).toThrow(/Unknown ODDS_PROVIDER/);
  });

  it("fetchData resolves a full OddsProviderData shape", async () => {
    delete process.env.ODDS_PROVIDER;
    const data = await getOddsProvider().fetchData();
    expect(data.sportsbooks.length).toBeGreaterThan(0);
    expect(data.events.length).toBeGreaterThan(0);
    expect(data.markets.length).toBeGreaterThan(0);
    expect(data.quotes.length).toBeGreaterThan(0);
  });
});
