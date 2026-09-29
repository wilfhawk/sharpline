import { describe, expect, it } from "vitest";
import { MockOddsProvider } from "./mock-provider";

describe("MockOddsProvider", () => {
  it("identifies itself as a mock provider", () => {
    const provider = new MockOddsProvider();
    expect(provider.name).toBe("mock");
    expect(provider.isMock).toBe(true);
  });

  it("fetchData resolves the mock fixture data", async () => {
    const data = await new MockOddsProvider().fetchData();
    expect(data.sportsbooks.length).toBeGreaterThan(0);
    expect(data.events.length).toBeGreaterThan(0);
  });
});
