"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBets, useCloseBet, useDeleteBet, type LoggedBet } from "@/hooks/useBets";
import { InfoTooltip } from "@/components/ui/info-tooltip";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function MyBets() {
  const { data: bets, isLoading, isError } = useBets();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        Couldn&apos;t load your bets. Try refreshing the page.
      </p>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
        No bets logged yet — use &quot;Log this bet&quot; on any opportunity to
        start tracking Closing Line Value.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {bets.map((bet) => (
        <BetRow key={bet.id} bet={bet} />
      ))}
    </div>
  );
}

function BetRow({ bet }: { bet: LoggedBet }) {
  const [closingPercent, setClosingPercent] = useState("");
  const closeBet = useCloseBet();
  const deleteBet = useDeleteBet();

  async function handleClose() {
    const probability = Number(closingPercent) / 100;
    if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) {
      toast.error("Enter a closing fair probability between 1 and 99%.");
      return;
    }
    try {
      await closeBet.mutateAsync({ id: bet.id, closingFairProbability: probability });
      toast.success("CLV computed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't close this bet.");
    }
  }

  async function handleDelete() {
    try {
      await deleteBet.mutateAsync(bet.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this bet.");
    }
  }

  return (
    <Card className="gap-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{bet.event_label}</p>
          <p className="text-xs text-muted-foreground">
            {bet.market_label} · {bet.sportsbook_name}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteBet.isPending}>
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm tabular-nums text-muted-foreground">
        <span>Stake {CURRENCY_FORMATTER.format(bet.stake)}</span>
        <span>Odds {bet.odds_decimal.toFixed(2)}</span>
        <span>{new Date(bet.placed_at).toLocaleDateString()}</span>
      </div>

      {bet.clv_percent !== null ? (
        <p className="flex items-center gap-1 text-sm font-medium">
          CLV
          <InfoTooltip>
            Closing Line Value — how much better your price was than the
            market&apos;s final (closing) price. Positive CLV over time is the
            strongest predictor of long-run betting profitability.
          </InfoTooltip>
          :{" "}
          <span className={bet.clv_percent >= 0 ? "text-emerald-400" : "text-red-400"}>
            {bet.clv_percent >= 0 ? "+" : ""}
            {bet.clv_percent.toFixed(2)}%
          </span>
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={99}
            placeholder="Closing fair %"
            value={closingPercent}
            onChange={(e) => setClosingPercent(e.target.value)}
            className="w-32"
          />
          <Button size="sm" onClick={handleClose} disabled={closeBet.isPending}>
            {closeBet.isPending ? "Computing..." : "Compute CLV"}
          </Button>
        </div>
      )}
    </Card>
  );
}
