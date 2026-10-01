"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LogBetValues } from "@/lib/validation/bets";

export interface LoggedBet {
  id: string;
  user_id: string;
  event_label: string;
  market_label: string;
  sportsbook_name: string;
  odds_decimal: number;
  stake: number;
  fair_probability_at_bet: number;
  placed_at: string;
  closing_fair_probability: number | null;
  clv_percent: number | null;
  closed_at: string | null;
  market_id: string | null;
  sportsbook_slug: string | null;
  side: "A" | "B" | null;
  event_start_time: string | null;
  closing_line_status: "pending" | "captured" | "missed";
  closing_captured_at: string | null;
}

async function fetchBets(): Promise<LoggedBet[]> {
  const res = await fetch("/api/bets");
  if (!res.ok) throw new Error(`Failed to load bets: ${res.status}`);
  const body = await res.json();
  return body.bets;
}

export function useBets() {
  return useQuery({ queryKey: ["bets"], queryFn: fetchBets });
}

export function useLogBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: LogBetValues) => {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to log bet: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bets"] }),
  });
}

export function useCloseBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      closingFairProbability,
    }: {
      id: string;
      closingFairProbability: number;
    }) => {
      const res = await fetch(`/api/bets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingFairProbability }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to close bet: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bets"] }),
  });
}

export function useDeleteBet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to delete bet: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bets"] }),
  });
}
