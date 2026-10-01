import { describe, expect, it } from "vitest";
import { filterLiveOnly, hasLiveOpportunities } from "./live";

function item(status: string) {
  return { event: { status } };
}

describe("hasLiveOpportunities", () => {
  it("returns true when at least one item is live", () => {
    expect(hasLiveOpportunities([item("upcoming"), item("live")])).toBe(true);
  });

  it("returns false when no items are live", () => {
    expect(hasLiveOpportunities([item("upcoming"), item("final")])).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(hasLiveOpportunities([])).toBe(false);
  });
});

describe("filterLiveOnly", () => {
  it("keeps only live items", () => {
    const items = [item("upcoming"), item("live"), item("final"), item("live")];
    expect(filterLiveOnly(items)).toHaveLength(2);
    expect(filterLiveOnly(items).every((i) => i.event.status === "live")).toBe(true);
  });

  it("returns an empty array when none are live", () => {
    expect(filterLiveOnly([item("upcoming")])).toEqual([]);
  });
});
