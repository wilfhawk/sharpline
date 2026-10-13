"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { evColorClasses, formatAmericanOdds, formatEvPercent, formatMarketType } from "@/lib/display";
import type { EvOpportunity } from "@/lib/types";

interface OpportunitiesResponse {
  opportunities: EvOpportunity[];
  facets: { sports: string[]; sportsbooks: { slug: string; name: string }[] };
  meta: { isMock: boolean; capturedAt: string };
}
interface GamesResponse { games: unknown[] }

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("unavailable");
  return response.json();
}

const CHECKS = [
  "Every edge names its reference book and the time of its price.",
  "Stale and invalid quotes are dropped before anything is scored.",
  "The de-vig method is shown, and Pro can switch between two models.",
  "Log a bet and we track its closing line value, so you can check the edge yourself.",
];

export function LiveProof() {
  const picks = useQuery({ queryKey: ["landing", "picks"], queryFn: () => getJson<OpportunitiesResponse>("/api/opportunities"), refetchInterval: 60_000 });
  const games = useQuery({ queryKey: ["landing", "games"], queryFn: () => getJson<GamesResponse>("/api/games"), refetchInterval: 60_000 });
  const data = picks.data;
  const stats = data ? [
    { label: "Games tracked", value: games.data ? String(games.data.games.length) : "-" },
    { label: "Sports", value: String(data.facets.sports.length) },
    { label: "Sportsbooks", value: String(data.facets.sportsbooks.length) },
    { label: "Updated", value: new Date(data.meta.capturedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) },
  ] : [];

  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <span className="text-sm font-medium">Today&apos;s free picks</span>
          <Badge variant="outline">{data?.meta.isMock ? "Sample data" : "Live feed"}</Badge>
        </div>
        {picks.isPending ? (
          <div className="space-y-3 p-4">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-10 w-full" />)}</div>
        ) : picks.isError || !data ? (
          <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">Live picks are temporarily unavailable. <Link href="/dashboard" className="underline">Open the dashboard</Link>.</p>
        ) : data.opportunities.length === 0 ? (
          <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">No edges above +2% right now. Markets are efficient most of the time, so check back soon.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data.opportunities.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.event.awayTeam} @ {row.event.homeTeam}</p>
                  <p className="text-xs text-muted-foreground">{row.sideLabel} / {row.sportsbook.name} / {formatMarketType(row.market.marketType)}{row.referenceBook ? ` / vs ${row.referenceBook}` : ""}</p>
                </div>
                <div className="flex items-center gap-4 tabular-nums text-muted-foreground">
                  <span>Odds {formatAmericanOdds(row.oddsDecimal)}</span>
                  <span>Fair {formatAmericanOdds(row.fairOddsDecimal)}</span>
                  <span className={`rounded px-1.5 py-0.5 font-medium ${evColorClasses(row.evPercent)}`}>{formatEvPercent(row.evPercent)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-4 border-t border-border/60 bg-muted/20 px-4 py-3 sm:grid-cols-4">
            {stats.map((stat) => <div key={stat.label}><dt className="text-xs text-muted-foreground">{stat.label}</dt><dd className="font-medium tabular-nums">{stat.value}</dd></div>)}
          </dl>
        )}
      </Card>
      <p className="mt-2 text-center text-xs text-muted-foreground">Free accounts see the day&apos;s top three. The full dashboard is open to view without an account.</p>
      <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-sm text-muted-foreground sm:grid-cols-2">
        {CHECKS.map((text) => <li key={text} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />{text}</li>)}
      </ul>
      <p className="mt-4 text-center text-sm"><Link href="/methodology" className="underline">Read the full methodology</Link></p>
    </section>
  );
}
