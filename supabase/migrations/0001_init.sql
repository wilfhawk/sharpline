-- SharpLine initial schema
-- Additive columns beyond the literal spec are called out below; everything else
-- matches the six tables in the project's data model exactly.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users: one row per Supabase Auth user (public.users.id === auth.users.id).
-- Added: age_gate_consented_at + jurisdiction_confirmed, required by the
-- signup age/jurisdiction gate (not in the original column list).
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  stripe_customer_id text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  age_gate_consented_at timestamptz,
  jurisdiction_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.sportsbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  sport text not null,
  league text not null,
  home_team text not null,
  away_team text not null,
  start_time timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'final'))
);

-- ---------------------------------------------------------------------------
-- markets: added market_group_id + side + selection so two rows can represent
-- the two sides of one two-way line (e.g. "Home ML" / "Away ML"), which the
-- EV engine needs to de-vig a pair. The original spec has no side concept.
-- ---------------------------------------------------------------------------
create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  market_type text not null check (market_type in ('moneyline', 'spread', 'total')),
  line_value numeric,
  market_group_id uuid not null,
  side text not null check (side in ('A', 'B')),
  selection text not null
);

create table if not exists public.odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  sportsbook_id uuid not null references public.sportsbooks (id) on delete cascade,
  odds_decimal numeric not null check (odds_decimal > 1),
  "timestamp" timestamptz not null default now()
);

create table if not exists public.ev_calculations (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  sportsbook_id uuid not null references public.sportsbooks (id) on delete cascade,
  fair_probability numeric not null check (fair_probability > 0 and fair_probability < 1),
  ev_percent numeric not null,
  computed_at timestamptz not null default now()
);

create index if not exists idx_markets_event_id on public.markets (event_id);
create index if not exists idx_markets_group_id on public.markets (market_group_id);
create index if not exists idx_odds_snapshots_market_id on public.odds_snapshots (market_id);
create index if not exists idx_ev_calculations_market_id on public.ev_calculations (market_id);
create index if not exists idx_ev_calculations_ev_percent on public.ev_calculations (ev_percent desc);

-- ---------------------------------------------------------------------------
-- Auto-create a public.users profile row whenever a new Supabase Auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.sportsbooks enable row level security;
alter table public.events enable row level security;
alter table public.markets enable row level security;
alter table public.odds_snapshots enable row level security;
alter table public.ev_calculations enable row level security;

create policy "Users can read their own row" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own row" on public.users
  for update using (auth.uid() = id);

-- Reference/market data is read-only and visible to any signed-in user; all
-- writes happen server-side via the service-role key (ingestion, webhooks).
create policy "Authenticated users can read sportsbooks" on public.sportsbooks
  for select to authenticated using (true);

create policy "Authenticated users can read events" on public.events
  for select to authenticated using (true);

create policy "Authenticated users can read markets" on public.markets
  for select to authenticated using (true);

create policy "Authenticated users can read odds snapshots" on public.odds_snapshots
  for select to authenticated using (true);

create policy "Authenticated users can read ev calculations" on public.ev_calculations
  for select to authenticated using (true);
