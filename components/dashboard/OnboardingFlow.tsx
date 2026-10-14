"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardProfile } from "@/hooks/useDashboardProfile";
import { useOpportunities } from "@/hooks/useOpportunities";
import { EMPTY_PROFILE, toggleValue } from "@/lib/dashboard-profile";

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {selected && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Two-step setup: pick the sports, then the sportsbooks, that the dashboard is built around. */
export function OnboardingFlow() {
  const router = useRouter();
  const { profile, isReady, save } = useDashboardProfile();
  // minEv 100 returns no opportunities; only the facet lists are needed.
  const { data, isLoading, isError } = useOpportunities({ minEv: 100 });
  const [step, setStep] = useState<0 | 1>(0);
  const [draftLeagues, setDraftLeagues] = useState<string[] | null>(null);
  const [draftBooks, setDraftBooks] = useState<string[] | null>(null);

  const leagues = draftLeagues ?? profile.leagues;
  const books = draftBooks ?? profile.sportsbooks;
  const leagueOptions = data?.facets.leagues ?? [];
  const bookOptions = data?.facets.sportsbooks ?? [];

  function finish(next = { leagues, sportsbooks: books }) {
    save(next);
    router.push("/dashboard");
  }

  const loading = isLoading || !isReady;
  const options = step === 0 ? leagueOptions : bookOptions;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Step {step + 1} of 2</p>
        <h1 className="mt-1 text-2xl font-semibold">{step === 0 ? "Which sports do you bet?" : "Which sportsbooks do you use?"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 0
            ? "Your dashboard will only show picks for these sports. Pick none to see every sport."
            : "We will only show prices at these books. Pick none to compare every book."}
        </p>
      </div>

      {loading && <Skeleton className="h-24 w-full" />}
      {isError && <p role="alert" className="text-sm text-destructive">Could not load the list. You can still skip and change this later from the dashboard.</p>}

      {!loading && options.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={step === 0 ? "Sports" : "Sportsbooks"}>
          {step === 0
            ? leagueOptions.map((league) => (
                <Chip key={league} selected={leagues.includes(league)} onClick={() => setDraftLeagues(toggleValue(leagues, league))}>{league}</Chip>
              ))
            : bookOptions.map((book) => (
                <Chip key={book.slug} selected={books.includes(book.slug)} onClick={() => setDraftBooks(toggleValue(books, book.slug))}>{book.name}</Chip>
              ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {step === 1 && <Button variant="outline" onClick={() => setStep(0)}>Back</Button>}
        {step === 0 ? <Button onClick={() => setStep(1)}>Next</Button> : <Button onClick={() => finish()}>Build my dashboard</Button>}
        <Button variant="ghost" onClick={() => finish(EMPTY_PROFILE)}>Skip, show everything</Button>
        {options.length > 0 && (step === 0 ? leagues : books).length > 0 && (
          <Button variant="link" onClick={() => (step === 0 ? setDraftLeagues([]) : setDraftBooks([]))}>Clear selection</Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">You can change these any time from the top of the dashboard.</p>
    </main>
  );
}
