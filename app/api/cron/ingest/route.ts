import { NextResponse, type NextRequest } from "next/server";
import { readFeed } from "@/lib/feed";
import { isCronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAllOpportunities } from "@/lib/opportunities";
import { findPositiveEV } from "@/lib/ev-engine";
import { attachPredictions, buildPredictionRecords } from "@/lib/predictions";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(process.env.CRON_SECRET, process.env.NODE_ENV, request.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const feed = await readFeed();
    if (!feed.isMock) {
      const admin = createAdminClient();
      const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const { error } = await admin.from("feed_snapshots").delete().lt("captured_at", cutoff);
      if (error) throw new Error("Snapshot retention cleanup failed.");
      await admin.from("daily_previews").delete().lt("preview_day", cutoff.slice(0, 10));

      // Best-effort: a logging failure must not fail ingestion.
      const records = buildPredictionRecords(attachPredictions(feed.data, findPositiveEV(computeAllOpportunities(feed.data), 2)));
      if (records.length > 0) {
        const { error: logError } = await admin.from("prediction_log").upsert(
          records.map((r) => ({
            market_id: r.marketId, side: r.side, model_version: r.modelVersion, sport: r.sport,
            event_start_time: r.eventStartTime, reference_probability: r.referenceProbability,
            model_probability: r.modelProbability, features: r.features,
          })),
          { onConflict: "market_id,side,model_version", ignoreDuplicates: true }
        );
        if (logError) console.error("prediction_log_failed", logError.message);
      }
    }
    return NextResponse.json({ ok: true, capturedAt: feed.capturedAt, events: feed.data.events.length, warnings: feed.warnings });
  } catch (error) {
    console.error("ingestion_failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Ingestion failed." }, { status: 503 });
  }
}