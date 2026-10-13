create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, email, age_gate_consented_at, jurisdiction_confirmed)
  values (
    new.id, new.email,
    case when new.raw_user_meta_data ->> 'age_jurisdiction_accepted' = 'true' then now() end,
    coalesce(new.raw_user_meta_data ->> 'age_jurisdiction_accepted' = 'true', false)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

create table public.feed_snapshots (
  id bigint generated always as identity primary key,
  provider_name text not null,
  captured_at timestamptz not null default now(),
  data jsonb not null,
  warnings jsonb not null default '[]'::jsonb
);
create index feed_snapshots_lookup on public.feed_snapshots(provider_name, captured_at desc);
alter table public.feed_snapshots enable row level security;
revoke all on public.feed_snapshots from anon, authenticated;
grant all on public.feed_snapshots to service_role;
grant usage, select on sequence public.feed_snapshots_id_seq to service_role;

create table public.daily_previews (
  preview_day date not null,
  provider_name text not null,
  opportunities jsonb not null,
  primary key (preview_day, provider_name)
);
alter table public.daily_previews enable row level security;
revoke all on public.daily_previews from anon, authenticated;
grant all on public.daily_previews to service_role;

grant update (closing_line_status) on public.logged_bets to authenticated;

create table public.alert_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  email_enabled boolean not null default false,
  ev_enabled boolean not null default true,
  arbitrage_enabled boolean not null default false,
  middles_enabled boolean not null default false,
  threshold_percent numeric not null default 5 check (threshold_percent between 0 and 100),
  unsubscribe_token uuid not null unique default gen_random_uuid()
);
alter table public.alert_preferences enable row level security;
create policy "Own alert preferences" on public.alert_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.alert_preferences from anon, authenticated;
grant select on public.alert_preferences to authenticated;
grant insert (user_id,email_enabled,ev_enabled,arbitrage_enabled,middles_enabled,threshold_percent),
  update (email_enabled,ev_enabled,arbitrage_enabled,middles_enabled,threshold_percent) on public.alert_preferences to authenticated;
grant all on public.alert_preferences to service_role;

create table public.alert_deliveries (
  delivery_key text primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  recipient text not null,
  subject text not null,
  html text not null,
  candidates jsonb not null,
  unsubscribe_url text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.alert_deliveries enable row level security;
revoke all on public.alert_deliveries from anon, authenticated;
grant all on public.alert_deliveries to service_role;