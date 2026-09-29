import { describe, expect, it } from "vitest";
import { americanToDecimal, decimalToAmerican } from "./odds-utils";

describe("americanToDecimal", () => {
  it("converts positive American odds", () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5, 5);
    expect(americanToDecimal(100)).toBeCloseTo(2.0, 5);
  });

  it("converts negative American odds", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909091, 5);
    expect(americanToDecimal(-200)).toBeCloseTo(1.5, 5);
  });

  it("throws on American odds between -99 and 99 (invalid range)", () => {
    expect(() => americanToDecimal(50)).toThrow();
    expect(() => americanToDecimal(-50)).toThrow();
    expect(() => americanToDecimal(0)).toThrow();
  });
});

describe("decimalToAmerican", () => {
  it("converts decimal odds >= 2 to positive American odds", () => {
    expect(decimalToAmerican(2.5)).toBeCloseTo(150, 5);
    expect(decimalToAmerican(2.0)).toBeCloseTo(100, 5);
  });

  it("converts decimal odds < 2 to negative American odds", () => {
    expect(decimalToAmerican(1.909091)).toBeCloseTo(-110, 0);
    expect(decimalToAmerican(1.5)).toBeCloseTo(-200, 5);
  });

  it("throws on decimal odds <= 1", () => {
    expect(() => decimalToAmerican(1)).toThrow();
    expect(() => decimalToAmerican(0.5)).toThrow();
  });
});

describe("round trip conversions", () => {
  it("american -> decimal -> american preserves value", () => {
    for (const american of [-500, -200, -110, 100, 110, 150, 300, 500]) {
      const decimal = americanToDecimal(american);
      expect(decimalToAmerican(decimal)).toBeCloseTo(american, 5);
    }
  });
});
