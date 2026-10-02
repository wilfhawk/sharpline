"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  evColorClasses,
  formatAmericanOdds,
  formatEvPercent,
} from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";
import type { EventOpportunityGroup } from "@/lib/opportunity-groups";
import { ExpandedRowDetail } from "./ExpandedRowDetail";
import { LiveOrTimeToStart } from "./OpportunityTable";

export function OpportunityCard({ group }: { group: EventOpportunityGroup }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);
  const opportunity = group.bestOpportunity;

  return (
    <Card className="gap-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">
            {opportunity.event.awayTeam} @ {opportunity.event.homeTeam}
          </p>
          <p className="text-xs text-muted-foreground">
            Best EV · {group.opportunities.length} {group.opportunities.length === 1 ? "offer" : "offers"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 text-sm font-medium tabular-nums ${evColorClasses(opportunity.evPercent)}`}
          >
            {formatEvPercent(opportunity.evPercent)}
          </span>
          <button
            type="button"
            aria-label={`${expanded ? "Hide" : "Show"} ${group.opportunities.length} ${group.opportunities.length === 1 ? "offer" : "offers"} for ${opportunity.event.awayTeam} at ${opportunity.event.homeTeam}`}
            aria-expanded={expanded}
            onClick={() => {
              setExpanded((current) => !current);
              setExpandedOpportunityId(null);
            }}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm tabular-nums text-muted-foreground">
        <span>Odds {formatAmericanOdds(opportunity.oddsDecimal)}</span>
        <span>Fair {formatAmericanOdds(opportunity.fairOddsDecimal)}</span>
        <span>
          <LiveOrTimeToStart
            status={opportunity.event.status}
            startTime={opportunity.event.startTime}
          />
        </span>
      </div>

      {expanded && (
        <div className="-mx-3 -mb-3 divide-y divide-border/60 border-t border-border/60 bg-muted/20">
          {group.opportunities.map((offer) => {
            const offerExpanded = expandedOpportunityId === offer.id;
            return (
              <div key={offer.id}>
                <button
                  type="button"
                  aria-expanded={offerExpanded}
                  onClick={() =>
                    setExpandedOpportunityId(offerExpanded ? null : offer.id)
                  }
                  className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{offer.sideLabel}</span>
                    <span className="block text-xs text-muted-foreground">
                      {offer.market.marketType} · {offer.sportsbook.name} · Odds {formatAmericanOdds(offer.oddsDecimal)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${evColorClasses(offer.evPercent)}`}>
                      {formatEvPercent(offer.evPercent)}
                    </span>
                    {offerExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </span>
                </button>
                {offerExpanded && <ExpandedRowDetail opportunity={offer} />}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
