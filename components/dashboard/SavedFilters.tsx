"use client";

import { useState } from "react";
import { toast } from "sonner";
import { XIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSavedFilters,
  useSaveFilter,
  useDeleteSavedFilter,
} from "@/hooks/useSavedFilters";
import type { OpportunityFilters } from "@/hooks/useOpportunities";

export interface SavedFiltersProps {
  currentFilters: OpportunityFilters;
  onApply: (filters: OpportunityFilters) => void;
}

/** Named filter presets (sport/book/market/minEV), per-user. Hidden entirely when signed out. */
export function SavedFilters({ currentFilters, onApply }: SavedFiltersProps) {
  const { data: savedFilters, isError } = useSavedFilters();
  const saveFilter = useSaveFilter();
  const deleteFilter = useDeleteSavedFilter();
  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState("");

  // Not signed in (or Supabase not configured) — saved filters aren't available.
  if (isError) return null;

  async function handleSave() {
    if (!name.trim()) return;
    try {
      await saveFilter.mutateAsync({ name: name.trim(), filters: currentFilters });
      setName("");
      setIsNaming(false);
      toast.success("Filter saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save filter.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(savedFilters ?? []).map((preset) => (
        <div
          key={preset.id}
          className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 py-0.5 pr-1 pl-2.5 text-xs"
        >
          <button
            type="button"
            onClick={() => onApply(preset.filters)}
            className="hover:text-foreground"
          >
            {preset.name}
          </button>
          <button
            type="button"
            aria-label={`Delete ${preset.name}`}
            onClick={() => deleteFilter.mutate(preset.id)}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ))}

      {isNaming ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            placeholder="Preset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-7 w-32 text-xs"
          />
          <Button size="sm" className="h-7" onClick={handleSave} disabled={saveFilter.isPending}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => {
              setIsNaming(false);
              setName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => setIsNaming(true)}
        >
          <PlusIcon className="size-3" /> Save filter
        </Button>
      )}
    </div>
  );
}
