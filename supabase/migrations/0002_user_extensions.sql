-- SharpLine: user-scoped extensions (CLV bet tracking + saved filter presets).
-- Additive to 0001_init.sql; both tables are entirely user-owned (RLS: auth.uid() = user_id).

-- ---------------------------------------------------------------------------
-- logged_bets: a user's self-reported bets, snapshotting the market at bet
-- time so CLV can be computed later against the closing fair price without
-- needing historical odds storage for every market.
-- ---------------------------------------------------------------------------
create table if not exists public.logged_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_label text not null,
  market_label text not null,
  sportsbook_name text not null,
  odds_decimal numeric not null check (odds_decimal > 1),
  stake numeric not null check (stake > 0),
  fair_probability_at_bet numeric not null check (fair_probability_at_bet > 0 and fair_probability_at_bet < 1),
  placed_at timestamptz not null default now(),
  closing_fair_probability numeric check (closing_fair_probability is null or (closing_fair_probability > 0 and closing_fair_probability < 1)),
  clv_percent numeric,
  closed_at timestamptz
);

create index if not exists idx_logged_bets_user_id on public.logged_bets (user_id);

alter table public.logged_bets enable row level security;

create policy "Users can read their own logged bets" on public.logged_bets
  for select using (auth.uid() = user_id);

create policy "Users can insert their own logged bets" on public.logged_bets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own logged bets" on public.logged_bets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own logged bets" on public.logged_bets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- saved_filters: named dashboard filter presets (sport/sportsbook/market/minEv).
-- ---------------------------------------------------------------------------
create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_saved_filters_user_id on public.saved_filters (user_id);

alter table public.saved_filters enable row level security;

create policy "Users can read their own saved filters" on public.saved_filters
  for select using (auth.uid() = user_id);

create policy "Users can insert their own saved filters" on public.saved_filters
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own saved filters" on public.saved_filters
  for delete using (auth.uid() = user_id);
