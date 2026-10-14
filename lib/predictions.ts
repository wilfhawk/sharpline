import { calculateFairProbabilities, computeEV } from "./ev-engine";
import { CONSENSUS_REFERENCE_PREFIX, MIN_CONSENSUS_BOOKS } from "./opportunities";
import type { OddsProviderData } from "./odds-provider";
import type {
  DevigMethod,
  EvOpportunity,
  MarketSide,
  ModelAgreement,
  OddsQuote,
  OpportunityPrediction,
  PredictionConfidence,
  SubscriptionTier,
} from "./types";

export const MODEL_VERSION = "v0-prior";

/** Hand-set priors, not fitted to data; replace with trained weights and bump MODEL_VERSION. */
export const MODEL_WEIGHTS = {
  /** Pull toward the soft-book consensus, in logit units per logit of gap. */
  gap: 0.35,
  /** Hard cap on how far the model may move from the market-derived probability. */
  maxShift: 0.03,
} as const;

/** Model EV at or above this (in %) counts as agreeing with the market's +EV call. */
export const AGREE_EDGE_PERCENT = 1;

export interface PredictionFeatures {
  referenceProbability: number;
  consensusProbability: number | null;
  gapLogit: number;
  bookCount: number;
  dispersion: number;
  hoursToStart: number;
  consensusReference: boolean;
}

export interface FullPrediction extends OpportunityPrediction {
  modelProbability: number;
  modelEdgePercent: number;
  features: PredictionFeatures;
}

export type PredictedOpportunity = EvOpportunity & { prediction: FullPrediction };

export interface PredictionRecord {
  marketId: string;
  side: MarketSide;
  modelVersion: string;
  eventStartTime: string;
  sport: string;
  referenceProbability: number;
  modelProbability: number;
  features: PredictionFeatures;
}

const PROB_FLOOR = 0.01;

export function logit(p: number): number {
  return Math.log(p / (1 - p));
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Market-anchored estimate: the reference probability nudged toward the soft-book consensus, capped at maxShift. */
export function modelProbability(features: PredictionFeatures): number {
  const base = clamp(features.referenceProbability, PROB_FLOOR, 1 - PROB_FLOOR);
  const raw = sigmoid(logit(base) + MODEL_WEIGHTS.gap * features.gapLogit);
  const capped = clamp(raw, base - MODEL_WEIGHTS.maxShift, base + MODEL_WEIGHTS.maxShift);
  return clamp(capped, PROB_FLOOR, 1 - PROB_FLOOR);
}

export function classifyAgreement(modelEdgePercent: number): ModelAgreement {
  if (modelEdgePercent >= AGREE_EDGE_PERCENT) return "agrees";
  if (modelEdgePercent < 0) return "disagrees";
  return "neutral";
}

export function classifyConfidence(features: PredictionFeatures): PredictionConfidence {
  if (features.consensusProbability === null || features.consensusReference) return "low";
  const points =
    (features.bookCount >= 6 ? 1 : 0) +
    (features.dispersion <= 0.02 ? 1 : 0) +
    (features.hoursToStart >= 1 && features.hoursToStart <= 48 ? 1 : 0);
  return points >= 3 ? "high" : points === 2 ? "medium" : "low";
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

function sideProbabilities(quotes: OddsQuote[], side: MarketSide, method: DevigMethod): number[] {
  const probabilities: number[] = [];
  for (const quote of quotes) {
    try {
      const fair = calculateFairProbabilities(quote.oddsDecimalA, quote.oddsDecimalB, method);
      probabilities.push(side === "A" ? fair.fairProbabilityA : fair.fairProbabilityB);
    } catch {
      // Invalid odds are excluded from the consensus.
    }
  }
  return probabilities;
}

export function buildFeatures(input: {
  referenceProbability: number;
  consensusReference: boolean;
  softQuotes: OddsQuote[];
  side: MarketSide;
  method: DevigMethod;
  startTime: string;
  now: number;
}): PredictionFeatures {
  const probabilities = sideProbabilities(input.softQuotes, input.side, input.method);
  const consensusProbability =
    !input.consensusReference && probabilities.length >= MIN_CONSENSUS_BOOKS
      ? probabilities.reduce((sum, p) => sum + p, 0) / probabilities.length
      : null;
  const ref = clamp(input.referenceProbability, PROB_FLOOR, 1 - PROB_FLOOR);
  const gapLogit =
    consensusProbability === null ? 0 : logit(clamp(consensusProbability, PROB_FLOOR, 1 - PROB_FLOOR)) - logit(ref);
  return {
    referenceProbability: input.referenceProbability,
    consensusProbability,
    gapLogit,
    bookCount: probabilities.length,
    dispersion: standardDeviation(probabilities),
    hoursToStart: (Date.parse(input.startTime) - input.now) / 3_600_000,
    consensusReference: input.consensusReference,
  };
}

/** Adds a full model prediction to each opportunity. Strip for the viewer's tier with `shapeForTier`. */
export function attachPredictions(
  data: OddsProviderData,
  opportunities: EvOpportunity[],
  method: DevigMethod = "multiplicative",
  now = Date.now()
): PredictedOpportunity[] {
  const sharpIds = new Set(data.sportsbooks.filter((book) => book.isSharpReference).map((book) => book.id));
  const softQuotesByMarket = new Map<string, OddsQuote[]>();
  for (const quote of data.quotes) {
    if (sharpIds.has(quote.sportsbookId)) continue;
    const existing = softQuotesByMarket.get(quote.marketId);
    if (existing) existing.push(quote);
    else softQuotesByMarket.set(quote.marketId, [quote]);
  }

  const cache = new Map<string, { features: PredictionFeatures; probability: number }>();

  return opportunities.map((opportunity) => {
    const key = `${opportunity.market.id}:${opportunity.side}:${opportunity.fairProbability}`;
    let cached = cache.get(key);
    if (!cached) {
      const features = buildFeatures({
        referenceProbability: opportunity.fairProbability,
        consensusReference: opportunity.referenceBook?.startsWith(CONSENSUS_REFERENCE_PREFIX) ?? false,
        softQuotes: softQuotesByMarket.get(opportunity.market.id) ?? [],
        side: opportunity.side,
        method,
        startTime: opportunity.event.startTime,
        now,
      });
      cached = { features, probability: modelProbability(features) };
      cache.set(key, cached);
    }
    const modelEdgePercent = computeEV(cached.probability, opportunity.oddsDecimal) * 100;
    return {
      ...opportunity,
      prediction: {
        modelVersion: MODEL_VERSION,
        agreement: classifyAgreement(modelEdgePercent),
        confidence: classifyConfidence(cached.features),
        modelProbability: cached.probability,
        modelEdgePercent,
        features: cached.features,
      },
    };
  });
}

/** Free sees no prediction, Plus sees agreement + confidence, Pro also sees probability and edge. */
export function shapeForTier(opportunities: PredictedOpportunity[], tier: SubscriptionTier): EvOpportunity[] {
  return opportunities.map(({ prediction, ...rest }) => {
    if (tier === "free") return rest;
    const base: OpportunityPrediction = {
      modelVersion: prediction.modelVersion,
      agreement: prediction.agreement,
      confidence: prediction.confidence,
    };
    if (tier === "pro") {
      base.modelProbability = prediction.modelProbability;
      base.modelEdgePercent = prediction.modelEdgePercent;
    }
    return { ...rest, prediction: base };
  });
}

/** One record per market side, for the prediction log. */
export function buildPredictionRecords(predicted: PredictedOpportunity[]): PredictionRecord[] {
  const records = new Map<string, PredictionRecord>();
  for (const o of predicted) {
    const key = `${o.market.id}:${o.side}`;
    if (records.has(key)) continue;
    records.set(key, {
      marketId: o.market.id,
      side: o.side,
      modelVersion: o.prediction.modelVersion,
      eventStartTime: o.event.startTime,
      sport: o.event.sport,
      referenceProbability: o.prediction.features.referenceProbability,
      modelProbability: o.prediction.modelProbability,
      features: o.prediction.features,
    });
  }
  return [...records.values()];
}
