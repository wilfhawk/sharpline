"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { OpportunityFilters } from "@/hooks/useOpportunities";
import type { SubscriptionTier } from "@/lib/types";
import { formatMarketType } from "@/lib/display";

const EV_THRESHOLDS = [0, 2, 3, 5, 10];

function evLabel(threshold: number): string {
  return threshold === 0 ? "All best odds" : `Min edge ${threshold}%`;
}

const ALL = "all";

export interface FilterBarProps {
  marketTypes: string[];
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
  tier: SubscriptionTier;
}

export function FilterBar({
  marketTypes,
  filters,
  onChange,
  tier,
}: FilterBarProps) {
  const isPro = tier === "pro";
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.marketType ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, marketType: !value || value === ALL ? undefined : value })
        }
      >
        <SelectTrigger aria-label="Market type" className="w-36">
          <SelectValue>{filters.marketType ? formatMarketType(filters.marketType) : "All markets"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All markets</SelectItem>
          {marketTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {formatMarketType(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(filters.minEv ?? 2)}
        onValueChange={(value) => onChange({ ...filters, minEv: Number(value ?? 2) })}
      >
        <SelectTrigger aria-label="Minimum EV" className="w-32">
          <SelectValue>{evLabel(filters.minEv ?? 2)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {EV_THRESHOLDS.map((threshold) => (
            <SelectItem key={threshold} value={String(threshold)}>
              {evLabel(threshold)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-expanded={showMore}
        onClick={() => setShowMore((current) => !current)}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        {showMore ? "Fewer filters" : "More filters"}
      </Button>

      {showMore && (
        <>
      <label className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
        <Checkbox
          checked={filters.liveOnly ?? false}
          onCheckedChange={(checked) => onChange({ ...filters, liveOnly: checked === true })}
        />
        <Label className="cursor-pointer font-normal">Live only</Label>
      </label>

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-sm">
          <Checkbox
            checked={isPro && (filters.modelAgrees ?? false)}
            disabled={!isPro}
            onCheckedChange={(checked) => onChange({ ...filters, modelAgrees: checked === true })}
          />
          <Label className="cursor-pointer font-normal">Model agrees</Label>
        </label>
        {!isPro && (
          <InfoTooltip>
            Showing only bets where the AI model also sees positive EV is a Pro feature.
          </InfoTooltip>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Select
          value={isPro ? filters.devigMethod ?? "multiplicative" : "multiplicative"}
          onValueChange={(value) =>
            onChange({ ...filters, devigMethod: value === "power" ? "power" : "multiplicative" })
          }
          disabled={!isPro}
        >
          <SelectTrigger aria-label="Odds method" className="w-44">
            <SelectValue>{isPro && filters.devigMethod === "power" ? "Method B (power)" : "Method A (standard)"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiplicative">Method A (standard)</SelectItem>
            <SelectItem value="power">Method B (power)</SelectItem>
          </SelectContent>
        </Select>
        {!isPro && (
          <InfoTooltip>
            Two ways to work out the true odds from the benchmark. Method A is the
            standard; choosing Method B is a Pro feature.
          </InfoTooltip>
        )}
      </div>
        </>
      )}
    </div>
  );
}
