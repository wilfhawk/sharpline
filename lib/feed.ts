import { getOddsProvider, getOddsCacheSeconds, type OddsProviderData } from "./odds-provider";
import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/config";
import { usableFeed } from "./feed-quality";
import { computeAllOpportunities } from "./opportunities";
import { findPositiveEV } from "./ev-engine";
import type { EvOpportunity } from "./types";

export interface FeedSnapshot {
  data: OddsProviderData;
  capturedAt: string;
  isMock: boolean;
  providerName: string;
  warnings: string[];
}

const emptyData: OddsProviderData = { events: [], sportsbooks: [], markets: [], quotes: [] };

export async function readFeed(delayed = false): Promise<FeedSnapshot> {
  const provider = getOddsProvider();
  const now = Date.now();
  if (provider.isMock) {
    const data = await provider.fetchData();
    return { data, capturedAt: new Date(now - (delayed ? 900_000 : 0)).toISOString(), isMock: true, providerName: provider.name, warnings: [] };
  }
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Snapshot storage is not configured.");
  const admin = createAdminClient();
  const cutoff = new Date(now - (delayed ? 900_000 : 0)).toISOString();
  const { data: stored, error } = await admin.from("feed_snapshots").select("data,captured_at,warnings")
    .eq("provider_name", provider.name).lte("captured_at", cutoff)
    .order("captured_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("Snapshot storage unavailable. Apply database migrations.");
  if (stored && (delayed || now - Date.parse(stored.captured_at) < getOddsCacheSeconds() * 1000)) {
    return {
      data: usableFeed(stored.data as OddsProviderData, Date.parse(stored.captured_at)),
      capturedAt: stored.captured_at, isMock: false, providerName: provider.name,
      warnings: stored.warnings ?? [],
    };
  }
  if (delayed) {
    // Seed a snapshot so the delayed feed has history within 15 minutes, without exposing live data.
    await readFeed(false).catch(() => undefined);
    return { data: emptyData, capturedAt: cutoff, isMock: false, providerName: provider.name, warnings: ["Delayed feed is warming up. No historical snapshot is available yet."] };
  }
  const raw = await provider.fetchData();
  const data = usableFeed(raw, now);
  const warnings = raw.warnings ?? [];
  if (data.quotes.length < raw.quotes.length) warnings.push("Some stale or invalid quotes were excluded.");
  const capturedAt = new Date(now).toISOString();
  const { error: insertError } = await admin.from("feed_snapshots").insert({ provider_name: provider.name, captured_at: capturedAt, data, warnings });
  if (insertError) throw new Error("Could not persist feed snapshot.");
  console.info("feed_ingested", { provider: provider.name, events: data.events.length, quotes: data.quotes.length, warnings });
  return { data, capturedAt, isMock: false, providerName: provider.name, warnings };
}

export async function dailyPreview(feed: FeedSnapshot): Promise<EvOpportunity[]> {
  const candidates = findPositiveEV(computeAllOpportunities(feed.data), 2).slice(0, 3);
  if (feed.isMock) return candidates;
  const admin = createAdminClient();
  const day = new Date().toISOString().slice(0, 10);
  if (candidates.length > 0) {
    const { error } = await admin.from("daily_previews").upsert({ preview_day: day, provider_name: feed.providerName, opportunities: candidates }, { onConflict: "preview_day,provider_name", ignoreDuplicates: true });
    if (error) throw new Error("Daily preview unavailable.");
  }
  const { data, error } = await admin.from("daily_previews").select("opportunities").eq("preview_day", day).eq("provider_name", feed.providerName).maybeSingle();
  if (error) throw new Error("Daily preview unavailable.");
  return (data?.opportunities ?? []) as EvOpportunity[];
}