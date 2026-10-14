"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, RefreshCw } from "lucide-react";
import { useGameCatalog } from "@/hooks/useGameCatalog";
import { useMarketComparison } from "@/hooks/useMarketComparison";
import type { CatalogGame } from "@/lib/game-catalog";
import { formatAmericanOdds, formatEvPercent } from "@/lib/display";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GameStart } from "./GameStart";

const selectClass = "h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm";

export function GamesView({ initialSearch = "", initialLeague = "" }: { initialSearch?: string; initialLeague?: string }) {
  const [league, setLeague] = useState(initialLeague);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [expanded, setExpanded] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const query = useGameCatalog({ refetchInterval: 30_000 });
  const games = query.data?.games ?? [];
  const leagues = [...new Set(games.map((game) => game.league))].sort();
  const options = ["", ...leagues];
  const cycle = (step: number) => setLeague(options[(options.indexOf(league) + step + options.length) % options.length]);
  const visible = games.filter((game) => (!league || game.league === league)
    && (!status || game.status === status) && `${game.homeTeam} ${game.awayTeam} ${game.league}`.toLowerCase().includes(deferredSearch));

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">All Games</h1><p className="mt-1 text-sm text-muted-foreground">{games.length} events across {leagues.length} sports</p></div><Button variant="outline" size="icon" title="Refresh games" aria-label="Refresh games" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} /></Button></div>
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{query.data?.meta.isMock ? "Sample data" : "Odds feed"}</span>{query.data && <span>Snapshot: {new Date(query.data.meta.capturedAt).toLocaleString()}</span>}<Link href="/dashboard" className="underline">+EV opportunities</Link></div>
    {query.data?.meta.warnings.map((warning) => <p key={warning} role="status" className="text-sm text-amber-600 dark:text-amber-300">{warning}</p>)}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_260px_160px]">
      <div className="relative col-span-2 md:col-span-1"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search teams or leagues" placeholder="Search teams or leagues" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" /></div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" title="Previous sport" aria-label="Previous sport" onClick={() => cycle(-1)}><ChevronLeft className="size-4" /></Button>
        <select aria-label="Sport" className={`${selectClass} flex-1`} value={league} onChange={(event) => setLeague(event.target.value)}><option value="">All sports</option>{leagues.map((value) => <option key={value}>{value}</option>)}</select>
        <Button variant="outline" size="icon" title="Next sport" aria-label="Next sport" onClick={() => cycle(1)}><ChevronRight className="size-4" /></Button>
      </div>
      <select aria-label="Game status" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All games</option><option value="upcoming">Upcoming</option><option value="live">Live</option></select>
    </div>
    {query.isPending ? <p role="status">Loading games...</p> : query.isError ? <p role="alert" className="text-destructive">{query.error.message}</p> : <>
      <p className="text-xs text-muted-foreground">{visible.length} matching games</p>
      <div className="divide-y divide-border border-y border-border">{visible.map((game) => <section key={game.id}>
        <button className="flex w-full items-center justify-between gap-4 py-4 text-left" aria-expanded={expanded === game.id} onClick={() => setExpanded(expanded === game.id ? null : game.id)}>
          <span className="min-w-0"><span className="block text-xs font-semibold tracking-wide text-muted-foreground uppercase">{game.league}</span><span className="mt-1 block break-words font-medium">{game.awayTeam} @ {game.homeTeam}</span><span className="mt-1 block text-xs text-muted-foreground"><GameStart status={game.status} startTime={game.startTime} /> / {game.markets.length} markets</span></span>
          {expanded === game.id ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
        </button>
        {expanded === game.id && <div className="space-y-3 pb-5"><Link href={`/games/${encodeURIComponent(game.id)}`} className="inline-block text-sm font-medium text-primary underline">View predictions for this game</Link>{query.data.meta.tier === "free" ? <p className="text-sm text-muted-foreground"><Link href="/account" className="underline">Plus or Pro</Link> includes all market prices and comparisons.</p> : <GamePrices game={game} />}</div>}
      </section>)}</div>
      {visible.length === 0 && <div className="py-10 text-center"><p>No games match these filters.</p><Button variant="link" onClick={() => { setSearch(""); setLeague(""); setStatus(""); }}>Clear filters</Button></div>}
    </>}
  </main>;
}

function GamePrices({ game }: { game: CatalogGame }) {
  const [marketId, setMarketId] = useState(game.markets[0]?.id ?? "");
  const comparison = useMarketComparison(marketId, Boolean(marketId));
  return <div className="space-y-3">
    {game.markets.length === 0 ? <p className="text-sm text-muted-foreground">No two-way markets available yet.</p> : <>
      <select aria-label="Market" className={`${selectClass} w-full max-w-xl`} value={marketId} onChange={(event) => setMarketId(event.target.value)}>{game.markets.map((market) => <option key={market.id} value={market.id}>{market.sideALabel} / {market.sideBLabel}</option>)}</select>
      {comparison.isPending ? <p>Loading prices...</p> : comparison.isError ? <p role="alert">Prices unavailable. Please try again.</p> : <div className="max-w-full overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead><tr className="border-b"><th className="py-2">Sportsbook</th><th>Selection</th><th className="text-right">Odds</th><th className="text-right">EV</th></tr></thead><tbody>{comparison.data?.map((row) => <tr key={`${row.sportsbook.id}:${row.side}`} className="border-b border-border/40"><td className="py-2">{row.sportsbook.name}</td><td>{row.sideLabel}</td><td className="text-right tabular-nums">{formatAmericanOdds(row.oddsDecimal)}</td><td className={`text-right tabular-nums ${row.evPercent !== null && row.evPercent > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>{row.evPercent === null ? row.sportsbook.isSharpReference ? "Reference" : "No benchmark" : formatEvPercent(row.evPercent)}</td></tr>)}</tbody></table>{comparison.data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">No fresh quotes available for this market.</p>}</div>}
    </>}
  </div>;
}