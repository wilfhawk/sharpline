"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SubscriptionTier } from "@/lib/types";

interface Preferences { email_enabled: boolean; ev_enabled: boolean; arbitrage_enabled: boolean; middles_enabled: boolean; threshold_percent: number }

export function EmailPreferences({ tier }: { tier: SubscriptionTier }) {
  const query = useQuery<{ settings: Preferences }>({ queryKey: ["email-preferences"], queryFn: async () => {
    const response = await fetch("/api/alert-settings");
    if (!response.ok) throw new Error("Email preferences are unavailable. Please retry after database setup.");
    return response.json();
  }, retry: false });
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading email preferences...</p>;
  if (query.isError) return <p role="alert" className="text-sm text-destructive">{query.error.message}</p>;
  return <PreferencesForm key={JSON.stringify(query.data.settings)} initial={query.data.settings} tier={tier} />;
}

function PreferencesForm({ initial, tier }: { initial: Preferences; tier: SubscriptionTier }) {
  const [settings, setSettings] = useState(initial);
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: async () => {
    const response = await fetch("/api/alert-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    if (!response.ok) throw new Error("Could not save email preferences.");
  }, onSuccess: () => client.invalidateQueries({ queryKey: ["email-preferences"] }) });
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
    {([ ["email_enabled", "Email alerts"], ["ev_enabled", "+EV saved-filter matches"], ["arbitrage_enabled", "Arbitrage (Pro)"], ["middles_enabled", "Middles (Pro)"] ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings[key]} disabled={key !== "email_enabled" && key !== "ev_enabled" && tier !== "pro"} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} />{label}</label>)}
    <label className="flex flex-wrap items-center gap-3 text-sm">Minimum email EV (%)<Input type="number" min={0} max={100} step={0.5} className="w-24" value={settings.threshold_percent} onChange={(event) => setSettings({ ...settings, threshold_percent: Number(event.target.value) })} /></label>
    <p className="text-xs text-muted-foreground">Email requires Plus or Pro. +EV emails match your saved filters; browser notifications are separate.</p>
    <Button type="submit" disabled={mutation.isPending}>Save email preferences</Button>
    {mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
  </form>;
}