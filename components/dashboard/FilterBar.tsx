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
import type { OpportunityFilters } from "@/hooks/useOpportunities";

const EV_THRESHOLDS = [2, 3, 5, 10];

const ALL = "all";

export interface FilterBarProps {
  sports: string[];
  sportsbooks: { slug: string; name: string }[];
  marketTypes: string[];
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
}

export function FilterBar({
  sports,
  sportsbooks,
  marketTypes,
  filters,
  onChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.sport ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, sport: !value || value === ALL ? undefined : value })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sport" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sports</SelectItem>
          {sports.map((sport) => (
            <SelectItem key={sport} value={sport}>
              {sport}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sportsbookSlug ?? ALL}
        onValueChange={(value) =>
          onChange({
            ...filters,
            sportsbookSlug: !value || value === ALL ? undefined : value,
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sportsbook" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sportsbooks</SelectItem>
          {sportsbooks.map((book) => (
            <SelectItem key={book.slug} value={book.slug}>
              {book.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.marketType ?? ALL}
        onValueChange={(value) =>
          onChange({ ...filters, marketType: !value || value === ALL ? undefined : value })
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Market" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All markets</SelectItem>
          {marketTypes.map((type) => (
            <SelectItem key={type} value={type} className="capitalize">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(filters.minEv ?? 2)}
        onValueChange={(value) => onChange({ ...filters, minEv: Number(value ?? 2) })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Min EV%" />
        </SelectTrigger>
        <SelectContent>
          {EV_THRESHOLDS.map((threshold) => (
            <SelectItem key={threshold} value={String(threshold)}>
              Min +{threshold}% EV
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
    </div>
  );
}
