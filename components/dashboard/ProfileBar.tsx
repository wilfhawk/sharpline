"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isEmptyProfile, toggleValue, type DashboardProfile } from "@/lib/dashboard-profile";

interface Option {
  value: string;
  label: string;
}

function summarize(selected: string[], options: Option[], allLabel: string, noun: string): string {
  if (selected.length === 0) return allLabel;
  const labels = selected.map((value) => options.find((option) => option.value === value)?.label ?? value);
  return labels.length <= 2 ? labels.join(", ") : `${labels.length} ${noun}`;
}

function MultiSelect({
  label,
  allLabel,
  noun,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  noun: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className="inline-flex h-9 min-w-40 max-w-64 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate">{summarize(selected, options, allLabel, noun)}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {options.length === 0 && <p className="px-1.5 py-1 text-xs text-muted-foreground">Nothing available yet.</p>}
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onChange(toggleValue(selected, option.value))}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface ProfileBarProps {
  leagues: string[];
  sportsbooks: { slug: string; name: string }[];
  profile: DashboardProfile;
  synced: boolean;
  onChange: (profile: DashboardProfile) => void;
}

/** Top-of-dashboard controls: pick sports and sportsbooks (saved to the viewer's profile) and look up any game. */
export function ProfileBar({ leagues, sportsbooks, profile, synced, onChange }: ProfileBarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          label="Sports"
          allLabel="All sports"
          noun="sports"
          options={leagues.map((league) => ({ value: league, label: league }))}
          selected={profile.leagues}
          onChange={(next) => onChange({ ...profile, leagues: next })}
        />
        <MultiSelect
          label="Sportsbooks"
          allLabel="All sportsbooks"
          noun="sportsbooks"
          options={sportsbooks.map((book) => ({ value: book.slug, label: book.name }))}
          selected={profile.sportsbooks}
          onChange={(next) => onChange({ ...profile, sportsbooks: next })}
        />
        {!isEmptyProfile(profile) && (
          <Button variant="ghost" size="sm" onClick={() => onChange({ leagues: [], sportsbooks: [] })}>
            Show all
          </Button>
        )}
        <form
          role="search"
          className="ml-auto flex w-full items-center gap-2 sm:w-auto"
          onSubmit={(event) => {
            event.preventDefault();
            router.push(`/games?search=${encodeURIComponent(search.trim())}`);
          }}
        >
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Look up a game"
              placeholder="Look up any game"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Find</Button>
        </form>
      </div>
      <p className="text-xs text-muted-foreground">
        {synced ? "Your picks are saved to your profile." : "Your picks are saved on this device. Log in to keep them on your account."}
        {" "}Leave both on &quot;All&quot; to see everything.
      </p>
    </div>
  );
}
