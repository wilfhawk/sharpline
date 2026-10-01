"use client";

import { useBankroll } from "@/hooks/useBankroll";
import { recommendedStake } from "@/lib/kelly";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { EvOpportunity } from "@/lib/types";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Suggested quarter-Kelly stake for one opportunity, based on the user's device-local bankroll setting. */
export function StakeSizer({ opportunity }: { opportunity: EvOpportunity }) {
  const { bankroll, setBankroll } = useBankroll();
  const stake = recommendedStake(
    bankroll,
    opportunity.fairProbability,
    opportunity.oddsDecimal
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Bankroll</span>
        <input
          type="number"
          min={0}
          step={50}
          value={bankroll}
          onChange={(e) => setBankroll(Number(e.target.value))}
          className="h-7 w-24 rounded-md border border-input bg-transparent px-2 text-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Bankroll"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="flex items-center gap-1 text-muted-foreground">
          Suggested stake (¼ Kelly)
          <InfoTooltip>
            The Kelly Criterion sizes your bet as a fraction of your bankroll
            based on your edge — quarter-Kelly bets 1/4 of that amount to
            reduce variance while still growing your bankroll over time.
          </InfoTooltip>
        </span>
        <span className="font-medium tabular-nums">
          {stake > 0 ? CURRENCY_FORMATTER.format(stake) : "—"}
        </span>
      </div>
    </div>
  );
}
