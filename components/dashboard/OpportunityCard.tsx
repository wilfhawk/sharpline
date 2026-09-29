"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  evColorClasses,
  formatAmericanOdds,
  formatEvPercent,
  formatTimeToStart,
} from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";
import { ExpandedRowDetail } from "./ExpandedRowDetail";

export function OpportunityCard({ opportunity }: { opportunity: EvOpportunity }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className="cursor-pointer gap-3 p-3"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {opportunity.event.awayTeam} @ {opportunity.event.homeTeam}
          </p>
          <p className="text-xs text-muted-foreground">
            {opportunity.sideLabel} · {opportunity.sportsbook.name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-sm font-medium tabular-nums ${evColorClasses(opportunity.evPercent)}`}
        >
          {formatEvPercent(opportunity.evPercent)}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm tabular-nums text-muted-foreground">
        <span>Odds {formatAmericanOdds(opportunity.oddsDecimal)}</span>
        <span>Fair {formatAmericanOdds(opportunity.fairOddsDecimal)}</span>
        <span>{formatTimeToStart(opportunity.event.startTime)}</span>
      </div>

      {expanded && (
        <div className="-mx-3 -mb-3">
          <ExpandedRowDetail opportunity={opportunity} />
        </div>
      )}
    </Card>
  );
}
