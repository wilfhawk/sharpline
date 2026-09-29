import { describe, expect, it } from "vitest";
import { buildSyntheticOddsHistory } from "./chart-utils";

describe("buildSyntheticOddsHistory", () => {
  it("ends at the current odds value with 'Now' as the last label", () => {
    const history = buildSyntheticOddsHistory(2.1, "mkt-1-sb-1", 6);
    expect(history).toHaveLength(6);
    expect(history[history.length - 1]).toEqual({ label: "Now", oddsDecimal: 2.1 });
  });

  it("is deterministic for the same seed key", () => {
    const a = buildSyntheticOddsHistory(1.91, "mkt-1-sb-1", 6);
    const b = buildSyntheticOddsHistory(1.91, "mkt-1-sb-1", 6);
    expect(a).toEqual(b);
  });

  it("produces different histories for different seed keys", () => {
    const a = buildSyntheticOddsHistory(1.91, "mkt-1-sb-1", 6);
    const b = buildSyntheticOddsHistory(1.91, "mkt-2-sb-9", 6);
    expect(a).not.toEqual(b);
  });

  it("never dips to or below 1.0 (invalid decimal odds)", () => {
    const history = buildSyntheticOddsHistory(1.02, "edge-case", 10);
    expect(history.every((h) => h.oddsDecimal > 1)).toBe(true);
  });
});
