"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBankroll } from "@/hooks/useBankroll";
import { useLogBet } from "@/hooks/useBets";
import { recommendedStake } from "@/lib/kelly";
import type { EvOpportunity } from "@/lib/types";

/** Opens a dialog to log a bet (for later CLV tracking) with the suggested stake prefilled. */
export function LogBetButton({ opportunity }: { opportunity: EvOpportunity }) {
  const [open, setOpen] = useState(false);
  const { bankroll } = useBankroll();
  const logBet = useLogBet();

  const suggestedStake = recommendedStake(
    bankroll,
    opportunity.fairProbability,
    opportunity.oddsDecimal
  );
  const [stake, setStake] = useState(suggestedStake || 10);

  async function handleLog() {
    try {
      await logBet.mutateAsync({
        eventLabel: `${opportunity.event.awayTeam} @ ${opportunity.event.homeTeam}`,
        marketLabel: opportunity.sideLabel,
        sportsbookName: opportunity.sportsbook.name,
        oddsDecimal: opportunity.oddsDecimal,
        stake,
        fairProbabilityAtBet: opportunity.fairProbability,
        marketId: opportunity.market.id,
        sportsbookSlug: opportunity.sportsbook.slug,
        side: opportunity.side,
        eventStartTime: opportunity.event.startTime,
      });
      toast.success("Bet logged — its closing line will be captured automatically near kickoff.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't log this bet.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        Log this bet
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log bet for CLV tracking</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 text-sm">
          <p className="text-muted-foreground">
            {opportunity.event.awayTeam} @ {opportunity.event.homeTeam} —{" "}
            {opportunity.sideLabel} · {opportunity.sportsbook.name}
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stake">Stake ($)</Label>
            <Input
              id="stake"
              type="number"
              min={1}
              step={1}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLog} disabled={logBet.isPending || stake <= 0}>
            {logBet.isPending ? "Logging..." : "Log bet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
