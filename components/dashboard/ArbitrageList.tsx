"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAmericanOdds, formatTimeToStart } from "@/lib/display";
import { useArbitrage } from "@/hooks/useArbitrage";
import { ProFeatureUpsell } from "./ProFeatureUpsell";

export function ArbitrageList() {
  const { data, isLoading, isError } = useArbitrage();
  const opportunities = data?.opportunities ?? [];

  if (data?.meta.gated) {
    return <ProFeatureUpsell feature="Arbitrage detection" />;
  }

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
        Couldn&apos;t load arbitrage opportunities. Try refreshing the page.
      </p>
    );
  }

  if (opportunities.length === 0) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        No cross-book arbitrage right now — these are rarer than +EV edges and
        close quickly when found.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {opportunities.map((arb) => (
        <Card key={arb.id} className="gap-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {arb.event.awayTeam} @ {arb.event.homeTeam}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTimeToStart(arb.event.startTime)}
              </p>
            </div>
            <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-sm font-medium tabular-nums text-emerald-400">
              +{arb.profitPercent.toFixed(2)}%
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <ArbLeg
              label={arb.sideA.sideLabel}
              bookName={arb.sideA.sportsbook.name}
              odds={arb.sideA.oddsDecimal}
              stakePercent={arb.sideA.stakePercent}
            />
            <ArbLeg
              label={arb.sideB.sideLabel}
              bookName={arb.sideB.sportsbook.name}
              odds={arb.sideB.oddsDecimal}
              stakePercent={arb.sideB.stakePercent}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ArbLeg({
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
