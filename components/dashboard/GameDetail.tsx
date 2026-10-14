"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useTierPreview } from "@/hooks/useTierPreview";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { evColorClasses, formatAmericanOdds, formatEvPercent, formatMarketType, formatGameStart } from "@/lib/display";
import type { GamePredictionView, GameSidePrediction } from "@/lib/game-predictions";
import type { SubscriptionTier } from "@/lib/types";
import { PredictionBadge, PredictionPanel } from "./PredictionPanel";

type GameResponse = GamePredictionView & {
  locked: boolean;
  meta: { tier: SubscriptionTier; isMock: boolean; capturedAt: string; warnings: string[] };
};

export function GameDetail({ eventId }: { eventId: string }) {
  const { tierPreview } = useTierPreview();
  const { profile, isReady } = useDashboardProfile();
  const query = useQuery<GameResponse>({
    queryKey: ["game-predictions", eventId, tierPreview, profile.sportsbooks],
    enabled: isReady,
    refetchInterval: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tierPreview) params.set("tier", tierPreview);
      if (profile.sportsbooks.length > 0) params.set("sportsbooks", profile.sportsbooks.join(","));
      const response = await fetch(`/api/games/${encodeURIComponent(eventId)}?${params}`);
      if (response.status === 404) throw new Error("This game is no longer in the feed.");
      if (!response.ok) throw new Error("Predictions are temporarily unavailable.");
      return response.json();
    },
  });

  const data = query.data;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <Link href="/games" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> All games
      </Link>

      {(query.isPending || !isReady) && <Skeleton className="h-40 w-full" />}
      {query.isError && <p role="alert" className="text-destructive">{query.error.message}</p>}

      {data && (
        <>
          <div>
            <p className="text-xs text-muted-foreground">
              {data.event.league} · {formatGameStart(data.event.startTime)} · {new Date(data.event.startTime).toLocaleString()}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">{data.event.awayTeam} @ {data.event.homeTeam}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Model predictions for every market, whether or not a price has an edge. Experimental; see the{" "}
              <Link href="/methodology" className="underline">methodology</Link>.
              {profile.sportsbooks.length > 0 && " Prices are from your selected sportsbooks when available."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.meta.isMock ? "Sample data · " : ""}Snapshot: {new Date(data.meta.capturedAt).toLocaleString()}
            </p>
          </div>

          {data.locked && (
            <p className="rounded-lg border border-border/60 px-4 py-6 text-sm text-muted-foreground">
              <Link href="/account" className="underline">Plus or Pro</Link> includes model predictions and prices for every market of this game.
            </p>
          )}

          {!data.locked && data.markets.length === 0 && (
            <p className="text-sm text-muted-foreground">No markets are available for this game yet.</p>
          )}

          {!data.locked && data.markets.map((market) => (
            <section key={market.marketId} className="rounded-xl border border-border/60">
              <h2 className="border-b border-border/60 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {formatMarketType(market.marketType)} · {market.sideALabel} / {market.sideBLabel}
              </h2>
              <ul className="divide-y divide-border/60">
                {market.sides.map((side) => <SideRow key={side.side} side={side} />)}
              </ul>
            </section>
          ))}
        </>
      )}
    </main>
  );
}

function SideRow({ side }: { side: GameSidePrediction }) {
  const [explain, setExplain] = useState(false);
  const pick = side.pick;
  const prediction = pick?.prediction;
  const isPro = prediction?.modelProbability !== undefined;

  return (
    <li className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{side.sideLabel}</span>
        {!pick ? (
          <span className="text-xs text-muted-foreground">No fair-odds benchmark for this market yet</span>
        ) : (
          <span className="flex flex-wrap items-center gap-2 text-sm tabular-nums">
            <span className="text-muted-foreground">
              {pick.sportsbook.name} {formatAmericanOdds(pick.oddsDecimal)}
              {!side.atYourBooks && " (not at your books)"}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-xs ${evColorClasses(pick.evPercent)}`}>{formatEvPercent(pick.evPercent)}</span>
            <PredictionBadge prediction={prediction} />
          </span>
        )}
      </div>

      {pick && isPro && (
        <dl className="grid grid-cols-3 gap-2 text-xs tabular-nums">
          <div><dt className="text-muted-foreground">Reference</dt><dd className="font-medium">{(pick.fairProbability * 100).toFixed(1)}%</dd></div>
          <div><dt className="text-muted-foreground">Model</dt><dd className="font-medium">{((prediction?.modelProbability ?? 0) * 100).toFixed(1)}%</dd></div>
          <div><dt className="text-muted-foreground">Model EV</dt><dd className="font-medium">{formatEvPercent(prediction?.modelEdgePercent ?? 0)}</dd></div>
        </dl>
      )}
      {pick && prediction && !isPro && (
        <p className="text-xs text-muted-foreground">{prediction.confidence} confidence. Model probability and explanation are Pro features.</p>
      )}

      {pick && isPro && (
        explain ? (
          <PredictionPanel opportunity={pick} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setExplain(true)}>Explain this prediction</Button>
        )
      )}
    </li>
  );
}
