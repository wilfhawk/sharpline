import { computeAllOpportunities } from "./opportunities";
import type { OddsProviderData } from "./odds-provider";
import type { MarketSide } from "./types";

/** Closing-line window: quotes this close to kickoff count as "closing". */
export const CLOSING_WINDOW_MS = 300_000;

export interface ScoredPrediction {
  referenceProbability: number;
  modelProbability: number;
  closingFairProbability: number;
}

export interface ReliabilityBin {
  label: string;
  count: number;
  meanModelProbability: number;
  meanClosingProbability: number;
}

export interface PredictionScorecard {
  count: number;
  /** Mean squared error of each estimate against the closing fair probability. */
  referenceMse: number;
  modelMse: number;
  /** Share of predictions where the model landed closer to the close than the reference did. */
  improvedShare: number;
  bins: ReliabilityBin[];
}

const BIN_EDGES = [0, 0.2, 0.4, 0.6, 0.8, 1.0001];

/** Closing fair probability for one market side, from the last quotes posted in the 5 minutes before kickoff. */
export function closingFairProbability(
  data: OddsProviderData,
  marketId: string,
  side: MarketSide,
  startMs: number
): number | null {
  const windowed: OddsProviderData = {
    ...data,
    quotes: data.quotes.filter((quote) => {
      const ts = Date.parse(quote.timestamp);
      return ts <= startMs && ts >= startMs - CLOSING_WINDOW_MS;
    }),
  };
  const match = computeAllOpportunities(windowed).find((o) => o.market.id === marketId && o.side === side);
  return match ? match.fairProbability : null;
}

export function scorePredictions(rows: ScoredPrediction[]): PredictionScorecard | null {
  if (rows.length === 0) return null;
  let referenceSse = 0;
  let modelSse = 0;
  let improved = 0;
  for (const row of rows) {
    const referenceError = row.referenceProbability - row.closingFairProbability;
    const modelError = row.modelProbability - row.closingFairProbability;
    referenceSse += referenceError ** 2;
    modelSse += modelError ** 2;
    if (Math.abs(modelError) < Math.abs(referenceError)) improved += 1;
  }

  const bins: ReliabilityBin[] = [];
  for (let i = 0; i < BIN_EDGES.length - 1; i++) {
    const inBin = rows.filter((r) => r.modelProbability >= BIN_EDGES[i] && r.modelProbability < BIN_EDGES[i + 1]);
    if (inBin.length === 0) continue;
    bins.push({
      label: `${Math.round(BIN_EDGES[i] * 100)}-${Math.min(100, Math.round(BIN_EDGES[i + 1] * 100))}%`,
      count: inBin.length,
      meanModelProbability: inBin.reduce((s, r) => s + r.modelProbability, 0) / inBin.length,
      meanClosingProbability: inBin.reduce((s, r) => s + r.closingFairProbability, 0) / inBin.length,
    });
  }

  return {
    count: rows.length,
    referenceMse: referenceSse / rows.length,
    modelMse: modelSse / rows.length,
    improvedShare: improved / rows.length,
    bins,
  };
}
