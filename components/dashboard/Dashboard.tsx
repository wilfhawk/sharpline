"use client";

import { useMemo, useState } from "react";
import { useOpportunities, type OpportunityFilters } from "@/hooks/useOpportunities";
import { FilterBar } from "./FilterBar";
import { MockDataBanner } from "./MockDataBanner";
import { OpportunityTable } from "./OpportunityTable";
import { OpportunityCard } from "./OpportunityCard";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const [filters, setFilters] = useState<OpportunityFilters>({ minEv: 2 });
  const { data, isLoading, isError } = useOpportunities(filters);

  const opportunities = data?.opportunities ?? [];

  const { sports, sportsbooks, marketTypes } = useMemo(() => {
    const sportSet = new Set<string>();
    const bookMap = new Map<string, string>();
    const marketSet = new Set<string>();
    for (const o of opportunities) {
      sportSet.add(o.event.sport);
      bookMap.set(o.sportsbook.slug, o.sportsbook.name);
      marketSet.add(o.market.marketType);
    }
    return {
      sports: [...sportSet].sort(),
      sportsbooks: [...bookMap.entries()]
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      marketTypes: [...marketSet].sort(),
    };
  }, [opportunities]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">+EV Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          U.S. sportsbook odds compared against de-vigged Pinnacle fair odds.
        </p>
      </div>

      {data?.meta.isMock && <MockDataBanner />}

      <FilterBar
        sports={sports}
        sportsbooks={sportsbooks}
        marketTypes={marketTypes}
        filters={filters}
        onChange={setFilters}
      />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Couldn&apos;t load opportunities. Try refreshing the page.
        </p>
      )}

      {!isLoading && !isError && opportunities.length === 0 && (
        <p className="rounded-lg border border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          No +EV opportunities above your minimum threshold right now — check
          back shortly, the feed refreshes every 20 seconds.
        </p>
      )}

      {!isLoading && !isError && opportunities.length > 0 && (
        <>
          <div className="hidden md:block">
            <OpportunityTable opportunities={opportunities} />
          </div>
          <div className="grid gap-3 md:hidden">
            {opportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
