-- Per-user dashboard profile: which leagues and sportsbooks to show. Empty arrays mean "all".

create table public.dashboard_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  leagues text[] not null default '{}' check (cardinality(leagues) <= 60),
  sportsbooks text[] not null default '{}' check (cardinality(sportsbooks) <= 60),
  updated_at timestamptz not null default now()
);

alter table public.dashboard_profiles enable row level security;
create policy "Own dashboard profile" on public.dashboard_profiles for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.dashboard_profiles from anon, authenticated;
grant select on public.dashboard_profiles to authenticated;
grant insert (user_id, leagues, sportsbooks, updated_at),
  update (leagues, sportsbooks, updated_at) on public.dashboard_profiles to authenticated;
grant all on public.dashboard_profiles to service_role;
