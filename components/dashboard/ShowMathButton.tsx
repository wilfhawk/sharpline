"use client";

import { Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatAmericanOdds, formatEvPercent } from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";

/** Compact breakdown of how this opportunity's EV% was derived from the sharp-book fair price. */
export function ShowMathButton({ opportunity }: { opportunity: EvOpportunity }) {
  const fairProbabilityPercent = (opportunity.fairProbability * 100).toFixed(1);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calculator className="size-3.5" />
            Show the math
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How this EV% was calculated</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Sharp book fair probability</dt>
          <dd className="text-right tabular-nums">{fairProbabilityPercent}%</dd>

          <dt className="text-muted-foreground">Fair odds (de-vigged)</dt>
          <dd className="text-right tabular-nums">
            {formatAmericanOdds(opportunity.fairOddsDecimal)}
          </dd>

          <dt className="text-muted-foreground">
            {opportunity.sportsbook.name}&apos;s odds
          </dt>
          <dd className="text-right tabular-nums">
            {formatAmericanOdds(opportunity.oddsDecimal)}
          </dd>

          <dt className="col-span-2 mt-1 border-t border-border/60 pt-1.5 text-muted-foreground">
            EV% = (fair probability × odds taken − 1) × 100
          </dt>
          <dd className="col-span-2 text-right font-medium tabular-nums">
            ({fairProbabilityPercent}% × {opportunity.oddsDecimal.toFixed(2)} − 1) × 100 ={" "}
            {formatEvPercent(opportunity.evPercent)}
          </dd>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
