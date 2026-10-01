import { describe, expect, it } from "vitest";
import {
  evColorClasses,
  formatAmericanOdds,
  formatEvPercent,
  formatTimeToStart,
} from "./display";

describe("formatAmericanOdds", () => {
  it("formats favorites with a leading minus", () => {
    expect(formatAmericanOdds(1.5)).toBe("-200");
  });

  it("formats underdogs with a leading plus", () => {
    expect(formatAmericanOdds(2.5)).toBe("+150");
  });
});

describe("formatEvPercent", () => {
  it("prefixes positive EV with a plus sign", () => {
    expect(formatEvPercent(5.234)).toBe("+5.2%");
  });

  it("leaves negative EV as-is", () => {
    expect(formatEvPercent(-3.1)).toBe("-3.1%");
  });
});

describe("formatTimeToStart", () => {
  const now = new Date("2026-09-29T12:00:00Z").getTime();

  it("returns LIVE once the event has started", () => {
    expect(formatTimeToStart("2026-09-29T11:00:00Z", now)).toBe("LIVE");
  });

  it("formats hours and minutes", () => {
    expect(formatTimeToStart("2026-09-29T15:15:00Z", now)).toBe("in 3h 15m");
  });

  it("formats minutes only", () => {
    expect(formatTimeToStart("2026-09-29T12:12:00Z", now)).toBe("in 12m");
  });

  it("formats whole hours only", () => {
    expect(formatTimeToStart("2026-09-29T14:00:00Z", now)).toBe("in 2h");
  });

  it("formats days and hours once at least a day away", () => {
    expect(formatTimeToStart("2026-10-01T16:00:00Z", now)).toBe("in 2d 4h");
  });

  it("formats whole days only", () => {
    expect(formatTimeToStart("2026-10-01T12:00:00Z", now)).toBe("in 2d");
  });
});

describe("evColorClasses", () => {
  it("uses the strongest green for EV well above threshold", () => {
    expect(evColorClasses(10, 2)).toContain("emerald-400");
  });

  it("uses a lighter green right at threshold", () => {
    expect(evColorClasses(2, 2)).toContain("emerald-500");
  });

  it("uses muted styling for positive-but-below-threshold EV", () => {
    expect(evColorClasses(1, 2)).toContain("muted-foreground");
  });

  it("uses red styling for negative EV", () => {
    expect(evColorClasses(-1, 2)).toContain("red-400");
  });
});
