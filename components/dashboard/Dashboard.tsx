"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOpportunities, type OpportunityFilters } from "@/hooks/useOpportunities";
import { useOpportunityAlerts } from "@/hooks/useOpportunityAlerts";
import { FilterBar } from "./FilterBar";
import { MockDataBanner } from "./MockDataBanner";
import { FreeTierBanner } from "./FreeTierBanner";
import { OpportunityTable } from "./OpportunityTable";
import { OpportunityCard } from "./OpportunityCard";
import { StatsRow } from "./StatsRow";
import { ArbitrageList } from "./ArbitrageList";
import { MiddlesList } from "./MiddlesList";
import { SgpBuilder } from "./SgpBuilder";
import { AlertSettings } from "./AlertSettings";
import { ProFeatureUpsell } from "./ProFeatureUpsell";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupOpportunitiesByEvent } from "@/lib/opportunity-groups";

export function Dashboard() {
  const [filters, setFilters] = useState<OpportunityFilters>({ minEv: 2 });
  const { data, isLoading, isError } = useOpportunities(filters);

  const opportunities = useMemo(() => data?.opportunities ?? [], [data?.opportunities]);
  const eventGroups = useMemo(
    () => groupOpportunitiesByEvent(opportunities),
    [opportunities]
  );

  useOpportunityAlerts(opportunities);

  const { sports, sportsbooks, marketTypes } = data?.facets ?? { sports: [], sportsbooks: [], marketTypes: [] };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">+EV Opportunities</h1>
        <p className="text-sm text-muted-foreground">
          Sportsbook prices compared against de-vigged sharp reference odds.
        </p>
        <Link href="/games" className="mt-1 w-fit text-sm text-primary underline">Browse all games and markets</Link>
      </div>

      {data?.meta.isMock && <MockDataBanner />}
      {data?.meta.tier === "free" && <FreeTierBanner />}
      {data && <p className="text-xs text-muted-foreground">Snapshot: {new Date(data.meta.capturedAt).toLocaleString()}</p>}
      {data?.meta.warnings.map((warning) => <p key={warning} role="status" className="text-sm text-amber-600 dark:text-amber-300">{warning}</p>)}

      <Tabs defaultValue="ev" className="gap-4">
        <TabsList className="grid h-auto w-full grid-cols-2 group-data-horizontal/tabs:h-auto sm:grid-cols-4">
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
            tier={data?.meta.tier ?? "free"}
          />

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
              No matching +EV opportunities. <Link href="/games" className="underline">Browse all games</Link> or adjust your filters.
            </p>
          )}

          {!isLoading && !isError && opportunities.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                {eventGroups.length} games across {opportunities.length} offers
              </p>
              <div className="hidden md:block">
                <OpportunityTable opportunities={opportunities} />
              </div>
              <div className="grid gap-3 md:hidden">
                {eventGroups.map((group) => (
                  <OpportunityCard key={group.eventId} group={group} />
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
          {data?.meta.tier === "pro" ? (
            <SgpBuilder opportunities={opportunities} />
          ) : (
            <ProFeatureUpsell feature="The Parlay Builder (SGP EV)" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

