"use client";

import { useMemo, useState } from "react";
import { useOpportunities, type OpportunityFilters } from "@/hooks/useOpportunities";
import { useOpportunityAlerts } from "@/hooks/useOpportunityAlerts";
import { FilterBar } from "./FilterBar";
import { MockDataBanner } from "./MockDataBanner";
import { OpportunityTable } from "./OpportunityTable";
import { OpportunityCard } from "./OpportunityCard";
import { StatsRow } from "./StatsRow";
import { ArbitrageList } from "./ArbitrageList";
import { MiddlesList } from "./MiddlesList";
import { SgpBuilder } from "./SgpBuilder";
import { SavedFilters } from "./SavedFilters";
import { AlertSettings } from "./AlertSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Dashboard() {
  const [filters, setFilters] = useState<OpportunityFilters>({ minEv: 2 });
  const { data, isLoading, isError } = useOpportunities(filters);

  const opportunities = data?.opportunities ?? [];

  useOpportunityAlerts(opportunities);

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

      <Tabs defaultValue="ev" className="gap-4">
        <TabsList>
          <TabsTrigger value="ev">+EV Opportunities</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="middles">Middles</TabsTrigger>
          <TabsTrigger value="parlays">Parlay Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="ev" className="flex flex-col gap-4">
          {!isLoading && !isError && opportunities.length > 0 && (
            <StatsRow opportunities={opportunities} sportsbookCount={sportsbooks.length} />
          )}

          <FilterBar
            sports={sports}
            sportsbooks={sportsbooks}
            marketTypes={marketTypes}
            filters={filters}
            onChange={setFilters}
          />

          <SavedFilters currentFilters={filters} onApply={setFilters} />

          <AlertSettings />

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
        </TabsContent>

        <TabsContent value="arbitrage">
          <ArbitrageList />
        </TabsContent>

        <TabsContent value="middles">
          <MiddlesList />
        </TabsContent>

        <TabsContent value="parlays">
          <SgpBuilder opportunities={opportunities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

