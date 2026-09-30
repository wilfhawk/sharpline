"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OpportunityFilters } from "./useOpportunities";

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filters: OpportunityFilters;
  created_at: string;
}

async function fetchSavedFilters(): Promise<SavedFilter[]> {
  const res = await fetch("/api/saved-filters");
  if (!res.ok) throw new Error(`Failed to load saved filters: ${res.status}`);
  const body = await res.json();
  return body.filters;
}

/** Saved filter presets are per-user (requires sign-in); silently empty when not authenticated. */
export function useSavedFilters() {
  return useQuery({
    queryKey: ["saved-filters"],
    queryFn: fetchSavedFilters,
    retry: false,
  });
}

export function useSaveFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { name: string; filters: OpportunityFilters }) => {
      const res = await fetch("/api/saved-filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to save filter: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-filters"] }),
  });
}

export function useDeleteSavedFilter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/saved-filters/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to delete filter: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-filters"] }),
  });
}
