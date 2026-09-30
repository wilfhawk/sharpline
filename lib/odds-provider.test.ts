import { afterEach, describe, expect, it } from "vitest";
import { getOddsProvider } from "./odds-provider";

const ORIGINAL_ODDS_PROVIDER = process.env.ODDS_PROVIDER;
const ORIGINAL_ODDS_API_KEY = process.env.ODDS_API_KEY;

afterEach(() => {
  process.env.ODDS_PROVIDER = ORIGINAL_ODDS_PROVIDER;
  process.env.ODDS_API_KEY = ORIGINAL_ODDS_API_KEY;
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

  it("throws for an unknown provider name", () => {
    process.env.ODDS_PROVIDER = "totally-not-a-real-provider";
    expect(() => getOddsProvider()).toThrow(/Unknown ODDS_PROVIDER/);
  });

  it("throws when the-odds-api is selected without ODDS_API_KEY", () => {
    process.env.ODDS_PROVIDER = "the-odds-api";
    delete process.env.ODDS_API_KEY;
    expect(() => getOddsProvider()).toThrow(/ODDS_API_KEY/);
  });

  it("returns a real the-odds-api provider once ODDS_API_KEY is set", () => {
    process.env.ODDS_PROVIDER = "the-odds-api";
    process.env.ODDS_API_KEY = "test-key";
    const provider = getOddsProvider();
    expect(provider.name).toBe("the-odds-api");
    expect(provider.isMock).toBe(false);
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
