import { describe, expect, it } from "vitest";
import { americanToDecimal } from "./odds-utils";
import { computeAllOpportunities } from "./opportunities";
import type { OddsProviderData } from "./odds-provider";
import {
  MODEL_VERSION,
  MODEL_WEIGHTS,
  attachPredictions,
  buildPredictionRecords,
  classifyAgreement,
  classifyConfidence,
  modelProbability,
  shapeForTier,
  type PredictionFeatures,
} from "./predictions";

const NOW = Date.parse("2026-10-14T12:00:00Z");

function fixture(softOdds: number[]): OddsProviderData {
  const event = {
    id: "evt-1",
    sport: "Football",
    league: "NFL",
    homeTeam: "Home",
    awayTeam: "Away",
    startTime: new Date(NOW + 5 * 3_600_000).toISOString(),
    status: "upcoming" as const,
  };
  const market = { id: "mkt-1", event, marketType: "moneyline" as const, lineValue: null, sideALabel: "Home ML", sideBLabel: "Away ML" };
  const timestamp = new Date(NOW).toISOString();
  return {
    events: [event],
    markets: [market],
    sportsbooks: [
      { id: "sb-pin", name: "Pinnacle", slug: "pinnacle", logoUrl: null, isSharpReference: true },
      ...softOdds.map((_, i) => ({ id: `sb-${i}`, name: `Book ${i}`, slug: `book-${i}`, logoUrl: null, isSharpReference: false })),
    ],
    quotes: [
      { marketId: "mkt-1", sportsbookId: "sb-pin", oddsDecimalA: americanToDecimal(-110), oddsDecimalB: americanToDecimal(-110), timestamp },
      ...softOdds.map((american, i) => ({
        marketId: "mkt-1",
        sportsbookId: `sb-${i}`,
        oddsDecimalA: americanToDecimal(american),
        oddsDecimalB: americanToDecimal(-american - 20),
        timestamp,
      })),
    ],
  };
}

function features(overrides: Partial<PredictionFeatures> = {}): PredictionFeatures {
  return {
    referenceProbability: 0.5,
    consensusProbability: 0.5,
    gapLogit: 0,
    bookCount: 6,
    dispersion: 0.01,
    hoursToStart: 5,
    consensusReference: false,
    ...overrides,
  };
}

describe("modelProbability", () => {
  it("equals the reference when consensus agrees", () => {
    expect(modelProbability(features())).toBeCloseTo(0.5, 10);
  });

  it("moves toward the consensus", () => {
    expect(modelProbability(features({ gapLogit: 0.1 }))).toBeGreaterThan(0.5);
    expect(modelProbability(features({ gapLogit: -0.1 }))).toBeLessThan(0.5);
  });

  it("never moves more than maxShift from the reference", () => {
    expect(modelProbability(features({ gapLogit: 5 }))).toBeCloseTo(0.5 + MODEL_WEIGHTS.maxShift, 10);
    expect(modelProbability(features({ gapLogit: -5 }))).toBeCloseTo(0.5 - MODEL_WEIGHTS.maxShift, 10);
  });

  it("stays inside (0, 1) for extreme references", () => {
    expect(modelProbability(features({ referenceProbability: 0.999, gapLogit: 5 }))).toBeLessThan(1);
    expect(modelProbability(features({ referenceProbability: 0.001, gapLogit: -5 }))).toBeGreaterThan(0);
  });
});

describe("classification", () => {
  it("classifies agreement by model edge", () => {
    expect(classifyAgreement(2)).toBe("agrees");
    expect(classifyAgreement(0.5)).toBe("neutral");
    expect(classifyAgreement(-0.1)).toBe("disagrees");
  });

  it("scores confidence from books, dispersion and timing", () => {
    expect(classifyConfidence(features())).toBe("high");
    expect(classifyConfidence(features({ bookCount: 3 }))).toBe("medium");
    expect(classifyConfidence(features({ bookCount: 3, dispersion: 0.1 }))).toBe("low");
    expect(classifyConfidence(features({ consensusProbability: null }))).toBe("low");
    expect(classifyConfidence(features({ consensusReference: true }))).toBe("low");
  });
});

describe("attachPredictions", () => {
  it("adds a full prediction with consensus features", () => {
    const data = fixture([105, 105, 105, 110]);
    const predicted = attachPredictions(data, computeAllOpportunities(data), "multiplicative", NOW);
    expect(predicted.length).toBeGreaterThan(0);
    const first = predicted[0];
    expect(first.prediction.modelVersion).toBe(MODEL_VERSION);
    expect(first.prediction.features.bookCount).toBe(4);
    expect(first.prediction.features.hoursToStart).toBeCloseTo(5, 5);
    expect(first.prediction.modelProbability).toBeGreaterThan(0);
  });

  it("has no consensus below the minimum book count", () => {
    const data = fixture([105, 105]);
    const predicted = attachPredictions(data, computeAllOpportunities(data), "multiplicative", NOW);
    expect(predicted[0].prediction.features.consensusProbability).toBeNull();
    expect(predicted[0].prediction.confidence).toBe("low");
  });
});

describe("shapeForTier", () => {
  const data = fixture([105, 105, 105, 110]);
  const predicted = attachPredictions(data, computeAllOpportunities(data), "multiplicative", NOW);

  it("removes predictions for free", () => {
    expect(shapeForTier(predicted, "free").every((o) => o.prediction === undefined)).toBe(true);
  });

  it("hides probability and features for plus", () => {
    const [o] = shapeForTier(predicted, "plus");
    expect(o.prediction?.agreement).toBeDefined();
    expect(o.prediction?.modelProbability).toBeUndefined();
    expect(JSON.stringify(o)).not.toContain("features");
  });

  it("exposes probability and edge for pro without features", () => {
    const [o] = shapeForTier(predicted, "pro");
    expect(o.prediction?.modelProbability).toBeDefined();
    expect(o.prediction?.modelEdgePercent).toBeDefined();
    expect(JSON.stringify(o)).not.toContain("features");
  });
});

describe("buildPredictionRecords", () => {
  it("dedupes to one record per market side", () => {
    const data = fixture([105, 105, 105, 110]);
    const predicted = attachPredictions(data, computeAllOpportunities(data), "multiplicative", NOW);
    const records = buildPredictionRecords(predicted);
    expect(records).toHaveLength(2);
    expect(new Set(records.map((r) => r.side))).toEqual(new Set(["A", "B"]));
  });
});
