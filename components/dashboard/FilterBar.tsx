"use client";

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
  return threshold === 0 ? "All best odds" : `Min +${threshold}% EV`;
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
          <SelectTrigger aria-label="De-vig model" className="w-44">
            <SelectValue>{isPro && filters.devigMethod === "power" ? "Power model" : "Multiplicative model"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiplicative">Multiplicative model</SelectItem>
            <SelectItem value="power">Power model</SelectItem>
          </SelectContent>
        </Select>
        {!isPro && (
          <InfoTooltip>
            Choosing the de-vig model used to compute fair odds (multiplicative vs.
            power) is a Pro feature.
          </InfoTooltip>
        )}
      </div>
    </div>
  );
}
