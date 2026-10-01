"use client";

import { useState } from "react";
import { Fragment } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
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
  formatTimeToStart,
} from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";
import { ExpandedRowDetail } from "./ExpandedRowDetail";
import { InfoTooltip } from "@/components/ui/info-tooltip";

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
  { key: "startTime", label: "Time to start" },
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...opportunities].sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col) => (
              <TableHead key={col.key}>
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
            ))}
            <TableHead>Market</TableHead>
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
          {sorted.map((o) => {
            const isExpanded = expandedId === o.id;
            return (
              <Fragment key={o.id}>
                <TableRow
                  className="cursor-pointer"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                >
                  <TableCell className="max-w-56 truncate font-medium">
                    {o.event.awayTeam} @ {o.event.homeTeam}
                    <div className="text-xs text-muted-foreground">
                      {o.sideLabel}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span
                      className={`rounded px-1.5 py-0.5 font-medium ${evColorClasses(o.evPercent)}`}
                    >
                      {formatEvPercent(o.evPercent)}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatAmericanOdds(o.oddsDecimal)}
                  </TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    <LiveOrTimeToStart status={o.event.status} startTime={o.event.startTime} />
                  </TableCell>
                  <TableCell className="capitalize">{o.market.marketType}</TableCell>
                  <TableCell>{o.sportsbook.name}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {formatAmericanOdds(o.fairOddsDecimal)}
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-0">
                      <ExpandedRowDetail opportunity={o} />
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

export function LiveOrTimeToStart({
  status,
  startTime,
}: {
  status: EvOpportunity["event"]["status"];
  startTime: string;
}) {
  if (status !== "live") return <>{formatTimeToStart(startTime)}</>;
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-red-400">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
      </span>
      LIVE
    </span>
  );
}
