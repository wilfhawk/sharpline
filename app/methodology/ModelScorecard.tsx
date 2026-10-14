import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MODEL_VERSION } from "@/lib/predictions";
import { scorePredictions, type PredictionScorecard } from "@/lib/prediction-scoring";

const MIN_SAMPLE = 30;

async function loadScorecard(): Promise<PredictionScorecard | null> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await createAdminClient()
      .from("prediction_log")
      .select("reference_probability, model_probability, closing_fair_probability")
      .eq("model_version", MODEL_VERSION)
      .not("closing_fair_probability", "is", null)
      .limit(5000);
    if (error || !data) return null;
    return scorePredictions(
      data.map((row) => ({
        referenceProbability: Number(row.reference_probability),
        modelProbability: Number(row.model_probability),
        closingFairProbability: Number(row.closing_fair_probability),
      }))
    );
  } catch {
    return null;
  }
}

export async function ModelScorecard() {
  const card = await loadScorecard();
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-medium text-foreground">8. The AI model and its scorecard</h2>
      <p>
        The model estimate starts from the sharp (or consensus) fair probability and moves it
        toward the average of the other books, capped at 3 percentage points. Its weights are
        hand-set priors (version <code className="rounded bg-muted/40 px-1 py-0.5 text-foreground">{MODEL_VERSION}</code>),
        not trained on outcomes, so treat it as experimental. A separate AI writer only turns
        those numbers into a plain-language explanation; it never sets a probability.
      </p>
      <p>
        Each prediction is logged once, then compared with the closing fair probability. The
        closing line is the best available proxy for the true probability, so lower error than
        the reference means the model moved toward where the market ended up.
      </p>
      {card && card.count >= MIN_SAMPLE ? (
        <div className="flex flex-col gap-2">
          <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <li className="rounded-lg bg-muted/40 p-3"><span className="block">Scored predictions</span><span className="text-base font-medium text-foreground tabular-nums">{card.count}</span></li>
            <li className="rounded-lg bg-muted/40 p-3"><span className="block">Reference error (MSE)</span><span className="text-base font-medium text-foreground tabular-nums">{card.referenceMse.toFixed(5)}</span></li>
            <li className="rounded-lg bg-muted/40 p-3"><span className="block">Model error (MSE)</span><span className="text-base font-medium text-foreground tabular-nums">{card.modelMse.toFixed(5)}</span></li>
            <li className="rounded-lg bg-muted/40 p-3"><span className="block">Model closer to close</span><span className="text-base font-medium text-foreground tabular-nums">{(card.improvedShare * 100).toFixed(1)}%</span></li>
          </ul>
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-left text-muted-foreground"><th className="py-1">Model probability</th><th>Predictions</th><th>Mean model</th><th>Mean closing</th></tr>
            </thead>
            <tbody>
              {card.bins.map((bin) => (
                <tr key={bin.label} className="border-t border-border/60">
                  <td className="py-1">{bin.label}</td>
                  <td>{bin.count}</td>
                  <td>{(bin.meanModelProbability * 100).toFixed(1)}%</td>
                  <td>{(bin.meanClosingProbability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg bg-muted/40 p-3 text-xs">
          Not enough scored predictions yet ({card?.count ?? 0} of {MIN_SAMPLE} needed). Results
          will appear here as games close.
        </p>
      )}
    </section>
  );
}
