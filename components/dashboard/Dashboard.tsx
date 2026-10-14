"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOpportunities, type OpportunityFilters } from "@/hooks/useOpportunities";
import { useOpportunityAlerts } from "@/hooks/useOpportunityAlerts";
import { FilterBar } from "./FilterBar";
import { ProfileBar } from "./ProfileBar";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { groupOpportunitiesByEvent } from "@/lib/opportunity-groups";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";

export function Dashboard() {
  const [baseFilters, setFilters] = useState<OpportunityFilters>({ minEv: 2 });
  const { profile, synced, isReady, onboarded, save } = useDashboardProfile();
  // The profile (sports + sportsbooks) is always applied; empty means all.
  const filters = useMemo<OpportunityFilters>(
    () => ({ ...baseFilters, leagues: profile.leagues, sportsbookSlugs: profile.sportsbooks }),
    [baseFilters, profile]
  );
  const { data, isLoading: isFetchingFirst, isError } = useOpportunities(filters, { enabled: isReady });
  const isLoading = isFetchingFirst || !isReady;

  const opportunities = useMemo(() => data?.opportunities ?? [], [data?.opportunities]);
  const eventGroups = useMemo(
    () => groupOpportunitiesByEvent(opportunities),
    [opportunities]
  );

  useOpportunityAlerts(opportunities);

  const { leagues, sportsbooks, marketTypes } = data?.facets ?? { leagues: [], sportsbooks: [], marketTypes: [] };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Best bets right now</h1>
        <p className="text-sm text-muted-foreground">
          Each row is a bet where a sportsbook pays more than it should. We work out the true odds from Pinnacle, the bookmaker sharp bettors trust most, and show how big the edge is.
        </p>
        <Link href="/games" className="mt-1 w-fit text-sm text-primary underline">Browse all games and markets</Link>
      </div>

      {data?.meta.isMock && <MockDataBanner />}
      {data?.meta.tier === "free" && <FreeTierBanner />}
      {data && <p className="text-xs text-muted-foreground">Snapshot: {new Date(data.meta.capturedAt).toLocaleString()}</p>}
      {data?.meta.warnings.map((warning) => <p key={warning} role="status" className="text-sm text-amber-600 dark:text-amber-300">{warning}</p>)}

      {isReady && !onboarded && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Build your dashboard</p>
            <p className="text-sm text-muted-foreground">Choose the sports and sportsbooks you bet and we will only show those.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" nativeButton={false} render={<Link href="/onboarding" />}>Choose sports</Button>
            <Button size="sm" variant="ghost" onClick={() => save({ leagues: [], sportsbooks: [] })}>Show everything</Button>
          </div>
        </div>
      )}

      <ProfileBar
        leagues={leagues}
        sportsbooks={sportsbooks}
        profile={profile}
        synced={synced}
        onChange={save}
      />

      <Tabs defaultValue="ev" className="gap-4">
        <TabsList className="grid h-auto w-full grid-cols-2 group-data-horizontal/tabs:h-auto sm:grid-cols-4">
          <TabsTrigger value="ev">Best bets</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="middles">Middles</TabsTrigger>
          <TabsTrigger value="parlays">Parlay Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="ev" className="flex flex-col gap-4">
          {!isLoading && !isError && opportunities.length > 0 && (
            <StatsRow opportunities={opportunities} sportsbookCount={sportsbooks.length} />
          )}

          <FilterBar
            marketTypes={marketTypes}
            filters={baseFilters}
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

