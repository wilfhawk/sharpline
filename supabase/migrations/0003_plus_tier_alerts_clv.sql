-- SharpLine: Plus tier, alert dedup log, and automated CLV capture support.
-- Additive to 0001_init.sql + 0002_user_extensions.sql.

-- ---------------------------------------------------------------------------
-- users: allow the new "plus" tier alongside "free"/"pro".
-- ---------------------------------------------------------------------------
alter table public.users drop constraint if exists users_subscription_tier_check;
alter table public.users
  add constraint users_subscription_tier_check
  check (subscription_tier in ('free', 'plus', 'pro'));

-- ---------------------------------------------------------------------------
-- alert_log: what's been emailed, for dedup (don't re-alert the same bet/line
-- within a cooldown window) and a future "alert history" UI. Written only by
-- the cron job (service role) — users can read their own rows.
-- ---------------------------------------------------------------------------
create table if not exists public.alert_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  saved_filter_id uuid references public.saved_filters (id) on delete set null,
  opportunity_type text not null check (opportunity_type in ('ev', 'arbitrage', 'middle')),
  market_id text not null,
  sportsbook_slug text not null,
  side text not null check (side in ('A', 'B')),
  ev_percent numeric,
  sent_at timestamptz not null default now()
);

-- Dedup lookup: "has (user, market, book, side) been alerted within the cooldown?"
create index if not exists idx_alert_log_dedup
  on public.alert_log (user_id, market_id, sportsbook_slug, side, sent_at desc);

alter table public.alert_log enable row level security;

create policy "Users can read their own alert log" on public.alert_log
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- logged_bets: structured fields needed to automatically re-fetch the same
-- market near kickoff and capture a true closing line, instead of relying on
-- a manual "closing fair %" entry. Nullable/optional so existing rows (and
-- bets logged before this migration) keep working with the manual fallback.
-- ---------------------------------------------------------------------------
alter table public.logged_bets add column if not exists market_id text;
alter table public.logged_bets add column if not exists sportsbook_slug text;
alter table public.logged_bets add column if not exists side text check (side in ('A', 'B'));
alter table public.logged_bets add column if not exists event_start_time timestamptz;
alter table public.logged_bets add column if not exists closing_line_status text
  not null default 'pending' check (closing_line_status in ('pending', 'captured', 'missed'));
alter table public.logged_bets add column if not exists closing_captured_at timestamptz;

-- Bets logged before this migration have no market_id, so they can never be
-- auto-captured — mark them "missed" so the UI doesn't show them as forever
-- "pending" (they still support the manual closing-fair-% fallback).
update public.logged_bets set closing_line_status = 'missed'
  where market_id is null and closing_fair_probability is null;

create index if not exists idx_logged_bets_pending_capture
  on public.logged_bets (event_start_time)
  where closing_line_status = 'pending';
