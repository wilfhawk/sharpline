"use client";

import { useQuery } from "@tanstack/react-query";
import { useTierPreview } from "@/hooks/useTierPreview";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatEvPercent } from "@/lib/display";
import type { Explanation, ExplanationSource } from "@/lib/prediction-explainer";
import type { EvOpportunity, ModelAgreement, OpportunityPrediction } from "@/lib/types";

const AGREEMENT_LABEL: Record<ModelAgreement, string> = {
  agrees: "Model agrees",
  neutral: "Model neutral",
  disagrees: "Model disagrees",
};

const AGREEMENT_CLASS: Record<ModelAgreement, string> = {
  agrees: "bg-emerald-500/15 text-emerald-400",
  neutral: "bg-muted text-muted-foreground",
  disagrees: "bg-red-500/15 text-red-400",
};

export function PredictionBadge({ prediction }: { prediction?: OpportunityPrediction }) {
  if (!prediction) return null;
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${AGREEMENT_CLASS[prediction.agreement]}`}
      title={`${prediction.confidence} confidence · experimental model ${prediction.modelVersion}`}
    >
      {AGREEMENT_LABEL[prediction.agreement]}
    </span>
  );
}

interface ExplainResponse {
  explanation: Explanation;
  source: ExplanationSource;
  reason?: string;
}

const EFFECT_CLASS = {
  supports: "text-emerald-400",
  against: "text-red-400",
  neutral: "text-muted-foreground",
} as const;

export function PredictionPanel({ opportunity }: { opportunity: EvOpportunity }) {
  const { tierPreview } = useTierPreview();
  const prediction = opportunity.prediction;
  const isPro = prediction?.modelProbability !== undefined;

  const explanation = useQuery<ExplainResponse>({
    queryKey: ["prediction-explanation", opportunity.id, opportunity.devigMethod, tierPreview],
    enabled: isPro,
    retry: false,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const params = tierPreview ? `?tier=${tierPreview}` : "";
      const response = await fetch(`/api/predictions/explain${params}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id, devigMethod: opportunity.devigMethod }),
      });
      if (!response.ok) throw new Error("Explanation unavailable.");
      return response.json();
    },
  });

  if (!prediction) return null;

  return (
    <div className="rounded-lg border border-border/60 p-3 text-sm sm:col-span-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Model view</h4>
        <PredictionBadge prediction={prediction} />
        <Badge variant="outline" className="text-[10px]">{prediction.confidence} confidence</Badge>
        <Badge variant="outline" className="text-[10px]">experimental</Badge>
      </div>

      {isPro ? (
        <>
          <dl className="grid grid-cols-3 gap-2 text-xs tabular-nums">
            <div>
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-medium">{(opportunity.fairProbability * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Model</dt>
              <dd className="font-medium">{((prediction.modelProbability ?? 0) * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Model EV</dt>
              <dd className="font-medium">{formatEvPercent(prediction.modelEdgePercent ?? 0)}</dd>
            </div>
          </dl>

          <div className="mt-3 space-y-2">
            {explanation.isPending && <Skeleton className="h-12 w-full" />}
            {explanation.isError && (
              <p className="text-xs text-muted-foreground">Explanation is unavailable right now.</p>
            )}
            {explanation.data && (
              <>
                <p>{explanation.data.explanation.summary}</p>
                <ul className="space-y-1 text-xs">
                  {explanation.data.explanation.factors.map((factor) => (
                    <li key={factor.label}>
                      <span className={`font-medium ${EFFECT_CLASS[factor.effect]}`}>{factor.label}:</span>{" "}
                      <span className="text-muted-foreground">{factor.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {explanation.data.explanation.caveat}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {explanation.data.source === "gemini"
                    ? "Explanation written by Gemini AI from the numbers above."
                    : `Standard summary (AI explanation unavailable${explanation.data.reason ? `: ${explanation.data.reason}` : ""}).`}
                </p>
              </>
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Model probability, edge and the AI explanation are Pro features.
        </p>
      )}
    </div>
  );
}
