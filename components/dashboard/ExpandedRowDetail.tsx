"use client";

import { useMarketComparison } from "@/hooks/useMarketComparison";
import type { OddsHistoryPoint } from "@/lib/chart-utils";
import { useQuery } from "@tanstack/react-query";
import { useTierPreview } from "@/hooks/useTierPreview";
import { evColorClasses, formatAmericanOdds, formatEvPercent } from "@/lib/display";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { LineMovementChart } from "./LineMovementChart";
import { StakeSizer } from "./StakeSizer";
import { CopyBetButton } from "./CopyBetButton";
import { ShowMathButton } from "./ShowMathButton";
import type { EvOpportunity } from "@/lib/types";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useBookTracker } from "@/hooks/useBookTracker";
import { activePromos } from "@/lib/book-tracker";
import { buttonVariants } from "@/components/ui/button";

export function ExpandedRowDetail({ opportunity }: { opportunity: EvOpportunity }) {
  const { tierPreview } = useTierPreview();
  const { books, promos } = useBookTracker();
  const bookProfile = books.find((book) => book.slug === opportunity.sportsbook.slug);
  const openPromos = activePromos(promos, opportunity.sportsbook.slug);
  const history = useQuery<OddsHistoryPoint[]>({
    queryKey: ["history", opportunity.id, tierPreview],
    queryFn: async () => {
      const params = new URLSearchParams({ book: opportunity.sportsbook.id, side: opportunity.side });
      if (tierPreview) params.set("tier", tierPreview);
      const response = await fetch(`/api/markets/${encodeURIComponent(opportunity.market.id)}/history?${params}`);
      if (!response.ok) throw new Error("Price history unavailable for this plan or market.");
      return (await response.json()).history;
    },
    retry: false,
  });
  const { data: rows, isLoading } = useMarketComparison(
    opportunity.market.id,
    true,
    opportunity.devigMethod
  );

  const sideARows = rows?.filter((r) => r.side === "A") ?? [];
  const sideBRows = rows?.filter((r) => r.side === "B") ?? [];

  return (
    <div className="grid gap-6 border-t border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
      {opportunity.referenceBook && <p className="text-xs text-muted-foreground sm:col-span-2">Reference: {opportunity.referenceBook} / {opportunity.devigMethod} / {opportunity.referenceTimestamp ? new Date(opportunity.referenceTimestamp).toLocaleString() : "Timestamp unavailable"}</p>}
      <div>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.market.sideALabel}
        </h4>
        <BookPriceList rows={sideARows} isLoading={isLoading} />
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.market.sideBLabel}
        </h4>
        <BookPriceList rows={sideBRows} isLoading={isLoading} />
      </div>

      <div className="sm:col-span-2">
        <h4 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {opportunity.sportsbook.name} — {opportunity.sideLabel} price history
        </h4>
        {history.data && history.data.length > 1 ? <LineMovementChart history={history.data} /> : (
          <p className="text-sm text-muted-foreground">{history.isPending ? "Loading history..." : history.isError ? "Price history is unavailable for this plan or market." : "No recorded price history yet."}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-start">
        <StakeSizer opportunity={opportunity} />
        <div className="flex gap-2">
          {opportunity.betLink && (
            <a
              href={opportunity.betLink}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Bet at {opportunity.sportsbook.name} <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
          <CopyBetButton opportunity={opportunity} />
          <ShowMathButton opportunity={opportunity} />
        </div>
      </div>
      {(bookProfile?.status === "limited" || bookProfile?.status === "closed" || openPromos.length > 0) && (
        <p className="text-xs text-muted-foreground sm:col-span-2">
          {bookProfile?.status === "closed" && `Your ${opportunity.sportsbook.name} account is marked closed. `}
          {bookProfile?.status === "limited" && `Your ${opportunity.sportsbook.name} account is marked limited${bookProfile.maxBet !== null ? ` (max bet $${bookProfile.maxBet})` : ""}. `}
          {openPromos.length > 0 && `You have ${openPromos.length} open ${openPromos.length === 1 ? "promo" : "promos"} here. `}
          <Link href="/books" className="underline">My Books</Link>
        </p>
      )}
    </div>
  );
}

function BookPriceList({
  rows,
  isLoading,
}: {
  rows: { sportsbook: { id: string; name: string }; oddsDecimal: number; evPercent: number | null; betLink?: string }[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
      {rows.map((row) => (
        <li
          key={row.sportsbook.id}
          className="flex items-center justify-between px-3 py-2 text-sm"
        >
          <span>
            {row.betLink ? (
              <a href={row.betLink} target="_blank" rel="noopener noreferrer" className="hover:underline" aria-label={`Open ${row.sportsbook.name}`}>
                {row.sportsbook.name}
              </a>
            ) : row.sportsbook.name}
          </span>
          <div className="flex items-center gap-2 tabular-nums">
            <span>{formatAmericanOdds(row.oddsDecimal)}</span>
            {row.evPercent === null ? (
              <Badge variant="outline" className="text-[10px]">
                Fair odds
              </Badge>
            ) : (
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${evColorClasses(row.evPercent)}`}
              >
                {formatEvPercent(row.evPercent)}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
