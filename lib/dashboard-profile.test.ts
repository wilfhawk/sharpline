import { describe, expect, it } from "vitest";
import {
  dashboardProfileSchema,
  isEmptyProfile,
  parseListParam,
  sanitizeProfile,
  toggleValue,
} from "./dashboard-profile";

describe("sanitizeProfile", () => {
  it("returns an empty (show-all) profile for bad input", () => {
    expect(sanitizeProfile(null)).toEqual({ leagues: [], sportsbooks: [] });
    expect(sanitizeProfile("x")).toEqual({ leagues: [], sportsbooks: [] });
    expect(sanitizeProfile({ leagues: "NFL" })).toEqual({ leagues: [], sportsbooks: [] });
  });

  it("trims, dedupes and drops non-strings and oversized values", () => {
    expect(sanitizeProfile({ leagues: [" NFL ", "NFL", 5, "", "x".repeat(200)], sportsbooks: ["draftkings"] })).toEqual({
      leagues: ["NFL"],
      sportsbooks: ["draftkings"],
    });
  });
});

describe("dashboardProfileSchema", () => {
  it("accepts valid and rejects oversized lists", () => {
    expect(dashboardProfileSchema.safeParse({ leagues: ["NFL"], sportsbooks: [] }).success).toBe(true);
    expect(dashboardProfileSchema.safeParse({ leagues: Array.from({ length: 61 }, (_, i) => `l${i}`), sportsbooks: [] }).success).toBe(false);
  });
});

describe("parseListParam", () => {
  it("returns null when absent or empty so nothing is filtered", () => {
    expect(parseListParam(null)).toBeNull();
    expect(parseListParam("")).toBeNull();
    expect(parseListParam(" , ")).toBeNull();
  });

  it("splits and dedupes", () => {
    expect(parseListParam("NFL,NBA,NFL")).toEqual(["NFL", "NBA"]);
  });
});

describe("toggleValue / isEmptyProfile", () => {
  it("toggles membership", () => {
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("detects the default profile", () => {
    expect(isEmptyProfile({ leagues: [], sportsbooks: [] })).toBe(true);
    expect(isEmptyProfile({ leagues: ["NFL"], sportsbooks: [] })).toBe(false);
  });
});
