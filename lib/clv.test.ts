import { describe, expect, it } from "vitest";
import { computeClv } from "./clv";

describe("computeClv", () => {
  it("returns 0 when the taken price exactly matches the closing fair price", () => {
    expect(computeClv(2.0, 0.5)).toBeCloseTo(0, 10);
  });

  it("returns positive CLV when the bettor beat the closing line", () => {
    // took 2.2, closing fair odds = 1/0.5 = 2.0 -> took a better price than fair settled at
    expect(computeClv(2.2, 0.5)).toBeCloseTo(10, 5);
  });

  it("returns negative CLV when the line moved against the bettor", () => {
    expect(computeClv(1.8, 0.5)).toBeCloseTo(-10, 5);
  });

  it("throws on invalid odds", () => {
    expect(() => computeClv(1, 0.5)).toThrow();
  });

  it("throws on invalid probability", () => {
    expect(() => computeClv(2.0, 0)).toThrow();
    expect(() => computeClv(2.0, 1)).toThrow();
  });
});
