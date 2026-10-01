"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useBankroll } from "@/hooks/useBankroll";
import { recommendedStake } from "@/lib/kelly";
import { formatAmericanOdds } from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";

/** Message type the SharpLine browser extension's content script listens for (see extension/). */
export const SHARPLINE_COPY_BET_MESSAGE = "SHARPLINE_COPY_BET";

function buildBetText(opportunity: EvOpportunity, stake: number): string {
  return [
    `${opportunity.event.awayTeam} @ ${opportunity.event.homeTeam}`,
    `${opportunity.sideLabel} · ${opportunity.sportsbook.name} · ${formatAmericanOdds(opportunity.oddsDecimal)}`,
    `Suggested stake: $${stake.toFixed(2)}`,
  ].join("\n");
}

/**
 * Copies a formatted bet summary to the clipboard and posts a message the
 * SharpLine browser extension (see extension/) can pick up to show an
 * overlay on the sportsbook's own site. Does NOT auto-fill the book's bet
 * slip — see extension/README.md for why that's out of scope for v1.
 */
export function CopyBetButton({ opportunity }: { opportunity: EvOpportunity }) {
  const { bankroll } = useBankroll();
  const stake =
    recommendedStake(bankroll, opportunity.fairProbability, opportunity.oddsDecimal) || 10;

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const text = buildBetText(opportunity, stake);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast.error("Couldn't access the clipboard — copy manually instead.");
      return;
    }

    window.postMessage(
      {
        type: SHARPLINE_COPY_BET_MESSAGE,
        bet: {
          event: `${opportunity.event.awayTeam} @ ${opportunity.event.homeTeam}`,
          side: opportunity.sideLabel,
          sportsbook: opportunity.sportsbook.name,
          odds: formatAmericanOdds(opportunity.oddsDecimal),
          stake,
          copiedAt: new Date().toISOString(),
        },
      },
      window.location.origin
    );

    toast.success("Bet copied — the SharpLine extension can show it on the book's site.");
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      <Copy className="size-3.5" />
      Copy bet
    </Button>
  );
}
