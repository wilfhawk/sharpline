"use client";

import { useMarketComparison } from "@/hooks/useMarketComparison";
import { buildSyntheticOddsHistory } from "@/lib/chart-utils";
import { evColorClasses, formatAmericanOdds, formatEvPercent } from "@/lib/display";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LineMovementChart } from "./LineMovementChart";
import type { EvOpportunity } from "@/lib/types";

export function ExpandedRowDetail({ opportunity }: { opportunity: EvOpportunity }) {
  const { data: rows, isLoading } = useMarketComparison(
    opportunity.market.id,
    true
  );

  const sideARows = rows?.filter((r) => r.side === "A") ?? [];
  const sideBRows = rows?.filter((r) => r.side === "B") ?? [];

  return (
    <div className="grid gap-6 border-t border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.market.sideALabel}
        </h4>
        <BookPriceList rows={sideARows} isLoading={isLoading} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.market.sideBLabel}
        </h4>
        <BookPriceList rows={sideBRows} isLoading={isLoading} />
      </div>

      <div className="sm:col-span-2">
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.sportsbook.name} — {opportunity.sideLabel} price history
        </h4>
        <LineMovementChart
          history={buildSyntheticOddsHistory(
            opportunity.oddsDecimal,
            opportunity.id
          )}
        />
      </div>
    </div>
  );
}

function BookPriceList({
  rows,
  isLoading,
}: {
  rows: { sportsbook: { id: string; name: string }; oddsDecimal: number; evPercent: number | null }[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
      {rows.map((row) => (
        <li
          key={row.sportsbook.id}
          className="flex items-center justify-between px-3 py-2 text-sm"
        >
          <span>{row.sportsbook.name}</span>
          <div className="flex items-center gap-2 tabular-nums">
            <span>{formatAmericanOdds(row.oddsDecimal)}</span>
            {row.evPercent === null ? (
              <Badge variant="outline" className="text-[10px]">
                Fair odds
              </Badge>
            ) : (
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${evColorClasses(row.evPercent)}`}
              >
                {formatEvPercent(row.evPercent)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
