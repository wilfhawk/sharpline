"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAlertSettings } from "./useAlertSettings";
import type { EvOpportunity } from "@/lib/types";

/**
 * Watches the polled opportunities feed and toasts when a *new* opportunity
 * (not seen on a previous poll) crosses the user's alert threshold. The very
 * first population of the feed never toasts — only genuinely new arrivals do.
 */
export function useOpportunityAlerts(opportunities: EvOpportunity[]) {
  const { settings } = useAlertSettings();
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (opportunities.length === 0) return;

    if (seenIds.current === null) {
      seenIds.current = new Set(opportunities.map((o) => o.id));
      return;
    }

    if (settings.enabled) {
      for (const o of opportunities) {
        if (!seenIds.current.has(o.id) && o.evPercent >= settings.thresholdPercent) {
          toast.success(
            `New +${o.evPercent.toFixed(1)}% EV: ${o.sideLabel} · ${o.sportsbook.name}`,
            { description: `${o.event.awayTeam} @ ${o.event.homeTeam}` }
          );
        }
      }
    }

    seenIds.current = new Set(opportunities.map((o) => o.id));
  }, [opportunities, settings.enabled, settings.thresholdPercent]);
}
