"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmericanOdds, formatTimeToStart } from "@/lib/display";
import { useMiddles } from "@/hooks/useMiddles";

export function MiddlesList() {
  const { data, isLoading, isError } = useMiddles();
  const opportunities = data?.opportunities ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Couldn&apos;t load middle opportunities. Try refreshing the page.
      </p>
    );
  }

  if (opportunities.length === 0) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        No middles right now — these appear when one book hasn&apos;t moved
        off a stale total line yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {opportunities.map((middle) => (
        <Card key={middle.id} className="gap-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {middle.event.awayTeam} @ {middle.event.homeTeam}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimeToStart(middle.event.startTime)} · Window {middle.windowLow}–{middle.windowHigh}
              </p>
            </div>
            <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-sm font-medium tabular-nums text-emerald-400">
              +{middle.bothWinProfitPercent.toFixed(1)}% if it hits
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <MiddleLegCard
              label={middle.overLeg.sideLabel}
              bookName={middle.overLeg.sportsbook.name}
              odds={middle.overLeg.oddsDecimal}
              stakePercent={middle.overLeg.stakePercent}
            />
            <MiddleLegCard
              label={middle.underLeg.sideLabel}
              bookName={middle.underLeg.sportsbook.name}
              odds={middle.underLeg.oddsDecimal}
              stakePercent={middle.underLeg.stakePercent}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Outside the window: {middle.singleWinProfitPercent >= 0 ? "+" : ""}
            {middle.singleWinProfitPercent.toFixed(1)}% (one leg wins). Not
            guaranteed like arbitrage — profit depends on the final result.
          </p>
        </Card>
      ))}
    </div>
  );
}

function MiddleLegCard({
  label,
  bookName,
  odds,
  stakePercent,
}: {
  label: string;
  bookName: string;
  odds: number;
  stakePercent: number;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-2 text-sm">
      <p className="font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{bookName}</p>
      <div className="mt-1 flex items-center justify-between tabular-nums">
        <span>{formatAmericanOdds(odds)}</span>
        <span className="text-muted-foreground">{stakePercent.toFixed(1)}% of stake</span>
      </div>
    </div>
  );
}
