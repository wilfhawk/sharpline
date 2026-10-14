import { describe, expect, it, vi } from "vitest";
import {
  buildPromptPayload,
  buildTemplateExplanation,
  explainPrediction,
  explanationSchema,
  sanitizeText,
  type ExplainInput,
} from "./prediction-explainer";

const input: ExplainInput = {
  eventLabel: "Away @ Home",
  sport: "Football",
  sideLabel: "Home ML",
  marketType: "moneyline",
  sportsbook: "Book A",
  americanOdds: "+105",
  referenceBook: "Pinnacle",
  referenceProbability: 0.5,
  modelProbability: 0.52,
  marketEvPercent: 2.5,
  modelEdgePercent: 6.6,
  confidence: "high",
  bookCount: 6,
  consensusProbability: 0.53,
  dispersion: 0.01,
  hoursToStart: 5,
};

function geminiResponse(text: string, ok = true) {
  return { ok, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) } as Response;
}

describe("sanitizeText", () => {
  it("strips control characters, collapses whitespace and truncates", () => {
    expect(sanitizeText("a\n\nIGNORE\tthis\u0000")).toBe("a IGNORE this");
    expect(sanitizeText("x".repeat(200), 10)).toHaveLength(10);
  });
});

describe("buildPromptPayload", () => {
  it("passes sanitized text and rounded numbers", () => {
    const payload = buildPromptPayload({ ...input, eventLabel: "Away\n@ Home" });
    expect(payload.event).toBe("Away @ Home");
    expect(payload.modelWinProbabilityPercent).toBe(52);
  });
});

describe("buildTemplateExplanation", () => {
  it("is valid against the schema", () => {
    expect(explanationSchema.safeParse(buildTemplateExplanation(input)).success).toBe(true);
    expect(explanationSchema.safeParse(buildTemplateExplanation({ ...input, consensusProbability: null })).success).toBe(true);
  });
});

describe("explainPrediction", () => {
  it("falls back to the template without an API key", async () => {
    const fetchImpl = vi.fn();
    const result = await explainPrediction(input, { apiKey: "", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.source).toBe("template");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns validated Gemini output", async () => {
    const body = { summary: "Model slightly above reference.", factors: [{ label: "Consensus", effect: "supports", detail: "Books average 53%." }], caveat: "Estimate only." };
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse(JSON.stringify(body)));
    const result = await explainPrediction(input, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.source).toBe("gemini");
    expect(result.explanation.summary).toBe(body.summary);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.headers["x-goog-api-key"]).toBe("k");
  });

  it("falls back on invalid JSON shape, HTTP errors and thrown errors", async () => {
    for (const fetchImpl of [
      vi.fn().mockResolvedValue(geminiResponse(JSON.stringify({ summary: "" }))),
      vi.fn().mockResolvedValue(geminiResponse("not json")),
      vi.fn().mockResolvedValue(geminiResponse("{}", false)),
      vi.fn().mockRejectedValue(new Error("network")),
    ]) {
      const result = await explainPrediction(input, { apiKey: "k", fetchImpl: fetchImpl as unknown as typeof fetch });
      expect(result.source).toBe("template");
    }
  });
});
