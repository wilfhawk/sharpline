"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useGameCatalog } from "@/hooks/useGameCatalog";

/** Header "All Games" dropdown: jump straight to one sport's games, or to everything. */
export function GamesNavMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { data, isPending } = useGameCatalog({ enabled: open });

  const counts = new Map<string, number>();
  for (const game of data?.games ?? []) counts.set(game.league, (counts.get(game.league) ?? 0) + 1);
  const leagues = [...counts.keys()].sort();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={`items-center gap-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        All Games
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-80 w-52" align="end">
        <DropdownMenuItem render={<Link href="/games" />}>All sports</DropdownMenuItem>
        {open && isPending && <p className="px-1.5 py-1 text-xs text-muted-foreground">Loading sports...</p>}
        {leagues.map((league) => (
          <DropdownMenuItem key={league} render={<Link href={`/games?league=${encodeURIComponent(league)}`} />}>
            <span className="flex-1">{league}</span>
            <span className="text-xs text-muted-foreground tabular-nums">{counts.get(league)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
