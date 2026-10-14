"use client";

import { useState } from "react";
import { Fragment } from "react";
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  evColorClasses,
  formatAmericanOdds,
  formatEvPercent,
  formatMarketType,
} from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";
import { groupOpportunitiesByEvent } from "@/lib/opportunity-groups";
import { ExpandedRowDetail } from "./ExpandedRowDetail";
import { GameStart } from "./GameStart";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { PredictionBadge } from "./PredictionPanel";

type SortKey = "event" | "evPercent" | "oddsDecimal" | "startTime";

const COLUMNS: { key: SortKey; label: string; definition?: string }[] = [
  { key: "event", label: "Event" },
  {
    key: "evPercent",
    label: "EV%",
    definition:
      "Expected Value — the edge this price has over the sharp book's de-vigged fair odds. Positive EV% means this bet is mathematically profitable long-run.",
  },
  { key: "oddsDecimal", label: "Odds" },
  { key: "startTime", label: "Starts" },
];

function sortValue(o: EvOpportunity, key: SortKey): number | string {
  switch (key) {
    case "event":
      return `${o.event.homeTeam} ${o.event.awayTeam}`;
    case "evPercent":
      return o.evPercent;
    case "oddsDecimal":
      return o.oddsDecimal;
    case "startTime":
      return new Date(o.event.startTime).getTime();
  }
}

export function OpportunityTable({
  opportunities,
}: {
  opportunities: EvOpportunity[];
}) {
  const [sortKey, setSortKey] = useState<SortKey>("evPercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedGroups = groupOpportunitiesByEvent(opportunities).sort((a, b) => {
    const av = sortValue(a.bestOpportunity, sortKey);
    const bv = sortValue(b.bestOpportunity, sortKey);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col, index) => (
              <Fragment key={col.key}>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    </button>
                    {col.definition && <InfoTooltip>{col.definition}</InfoTooltip>}
                  </span>
                </TableHead>
                {index === 0 && <TableHead>Bet on</TableHead>}
              </Fragment>
            ))}
            <TableHead>Sportsbook</TableHead>
            <TableHead>
              <span className="flex items-center gap-1">
                Fair Odds
                <InfoTooltip>
                  The sharp book&apos;s (e.g. Pinnacle) de-vigged odds — the
                  benchmark &quot;true&quot; price this opportunity is compared against.
                </InfoTooltip>
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGroups.map((group) => {
            const o = group.bestOpportunity;
            const isExpanded = expandedEventId === group.eventId;
            return (
              <Fragment key={group.eventId}>
                <TableRow
                  className="cursor-pointer"
                  aria-expanded={isExpanded}
                  onClick={() => {
                    setExpandedEventId(isExpanded ? null : group.eventId);
                    setExpandedOpportunityId(null);
                  }}
                >
                  <TableCell className="max-w-56 font-medium">
                    <span className="mb-0.5 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      {o.event.league}
                    </span>
                    <div className="truncate">{o.event.awayTeam} @ {o.event.homeTeam}</div>
                    <div className="text-xs font-normal text-muted-foreground">
                      Best EV · {group.opportunities.length} {group.opportunities.length === 1 ? "offer" : "offers"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-emerald-500">{o.sideLabel}</div>
                    <div className="text-xs text-muted-foreground">{formatMarketType(o.market.marketType)}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span
                      className={`rounded px-1.5 py-0.5 font-medium ${evColorClasses(o.evPercent)}`}
                    >
                      {formatEvPercent(o.evPercent)}
                    </span>
                    <div className="mt-1"><PredictionBadge prediction={o.prediction} /></div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmericanOdds(o.oddsDecimal)}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    <GameStart status={o.event.status} startTime={o.event.startTime} />
                  </TableCell>
                  <TableCell className="font-medium">{o.sportsbook.name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatAmericanOdds(o.fairOddsDecimal)}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                      <div className="divide-y divide-border/60 bg-muted/20">
                        {group.opportunities.map((offer) => {
                          const offerExpanded = expandedOpportunityId === offer.id;
                          return (
                            <div key={offer.id}>
                              <button
                                type="button"
                                aria-expanded={offerExpanded}
                                onClick={() =>
                                  setExpandedOpportunityId(
                                    offerExpanded ? null : offer.id
                                  )
                                }
                                className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-muted/30"
                              >
                                <span className="min-w-0">
                                  <span className="font-medium">{offer.sideLabel}</span>
                                  <span className="text-muted-foreground">
                                    {` · ${formatMarketType(offer.market.marketType)} · ${offer.sportsbook.name}`}
                                  </span>
                                </span>
                                <span className="flex items-center gap-3 tabular-nums">
                                  <span>{formatAmericanOdds(offer.oddsDecimal)}</span>
                                  <span className={`rounded px-1.5 py-0.5 ${evColorClasses(offer.evPercent)}`}>
                                    {formatEvPercent(offer.evPercent)}
                                  </span>
                                  {offerExpanded ? (
                                    <ChevronDown className="size-4" />
                                  ) : (
                                    <ChevronRight className="size-4" />
                                  )}
                                </span>
                              </button>
                              {offerExpanded && (
                                <ExpandedRowDetail opportunity={offer} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown className="size-3 opacity-50" />;
  return dir === "asc" ? (
    <ChevronUp className="size-3" />
  ) : (
    <ChevronDown className="size-3" />
  );
}
