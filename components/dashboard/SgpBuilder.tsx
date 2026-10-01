"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeSgpEv } from "@/lib/sgp";
import { evColorClasses, formatAmericanOdds, formatEvPercent } from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";

/**
 * Lets a user pick 2+ legs from the same event's +EV opportunities and get a
 * same-game-parlay EV estimate. v1 SIMPLIFIED heuristic (see lib/sgp.ts) —
 * the correlation factor is a manual estimate, not derived from historical
 * data, since true SGP correlation modeling needs a result-history dataset
 * this app doesn't have yet.
 */
export function SgpBuilder({ opportunities }: { opportunities: EvOpportunity[] }) {
  const eventOptions = useMemo(() => {
    const byEvent = new Map<string, { id: string; label: string; count: number }>();
    for (const o of opportunities) {
      const existing = byEvent.get(o.event.id);
      if (existing) {
        existing.count += 1;
      } else {
        byEvent.set(o.event.id, {
          id: o.event.id,
          label: `${o.event.awayTeam} @ ${o.event.homeTeam}`,
          count: 1,
        });
      }
    }
    return [...byEvent.values()].filter((e) => e.count >= 2);
  }, [opportunities]);

  const [eventId, setEventId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [correlationFactor, setCorrelationFactor] = useState(1.2);

  const activeEventId = eventId ?? eventOptions[0]?.id;
  const eventLegs = opportunities.filter((o) => o.event.id === activeEventId);
  const selectedLegs = eventLegs.filter((o) => selectedIds.includes(o.id));

  function toggleLeg(leg: EvOpportunity) {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(leg.id);
      // At most one leg per market (can't bet both sides of the same line).
      const withoutSameMarket = prev.filter((id) => {
        const other = eventLegs.find((e) => e.id === id);
        return other ? other.market.id !== leg.market.id : true;
      });
      return isSelected ? withoutSameMarket : [...withoutSameMarket, leg.id];
    });
  }

  const result =
    selectedLegs.length >= 1
      ? computeSgpEv(
          selectedLegs.map((l) => ({
            id: l.id,
            label: l.sideLabel,
            oddsDecimal: l.oddsDecimal,
            fairProbability: l.fairProbability,
          })),
          correlationFactor
        )
      : null;

  if (eventOptions.length === 0) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        Need at least 2 +EV opportunities on the same event to build a parlay
        — check back once more markets are live.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={activeEventId}
          onValueChange={(value) => {
            setEventId(value ?? undefined);
            setSelectedIds([]);
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Event" />
          </SelectTrigger>
          <SelectContent>
            {eventOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Label htmlFor="sgp-correlation" className="text-sm text-muted-foreground">
            Correlation factor
          </Label>
          <Input
            id="sgp-correlation"
            type="number"
            step="0.1"
            min="0.1"
            className="w-24"
            value={correlationFactor}
            onChange={(e) => setCorrelationFactor(Math.max(0.1, Number(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {eventLegs.map((leg) => (
          <label
            key={leg.id}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 text-sm"
          >
            <Checkbox
              checked={selectedIds.includes(leg.id)}
              onCheckedChange={() => toggleLeg(leg)}
              className="mt-0.5"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{leg.sideLabel}</span>
              <span className="block text-xs text-muted-foreground">
                {leg.sportsbook.name} · {formatAmericanOdds(leg.oddsDecimal)} ·{" "}
                <span className={evColorClasses(leg.evPercent)}>
                  {formatEvPercent(leg.evPercent)} alone
                </span>
              </span>
            </span>
          </label>
        ))}
      </div>

      {result && (
        <Card className="gap-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedLegs.length}-leg parlay · combined odds
            </span>
            <span className="font-medium tabular-nums">
              {formatAmericanOdds(result.combinedOddsDecimal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated parlay EV</span>
            <span className={`rounded px-1.5 py-0.5 font-medium tabular-nums ${evColorClasses(result.evPercent)}`}>
              {formatEvPercent(result.evPercent)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Simplified estimate: independence-assumed joint probability (
            {(result.independenceFairProbability * 100).toFixed(1)}%) scaled by your
            correlation factor to {(result.adjustedFairProbability * 100).toFixed(1)}%
            — not true copula/correlation modeling. Treat as a rough guide, not a
            precise edge.
          </p>
        </Card>
      )}
    </div>
  );
}
