-- Restrict self-service profile updates and add shared public API rate limits.

revoke all on public.users from anon;
revoke update on public.users from authenticated;
grant select on public.users to authenticated;
grant update (age_gate_consented_at, jurisdiction_confirmed)
  on public.users to authenticated;

revoke all on public.logged_bets from anon, authenticated;
grant select, delete on public.logged_bets to authenticated;
grant insert (
  user_id,
  event_label,
  market_label,
  sportsbook_name,
  odds_decimal,
  stake,
  fair_probability_at_bet,
  market_id,
  sportsbook_slug,
  side,
  event_start_time
) on public.logged_bets to authenticated;
grant update (closing_fair_probability, clv_percent, closed_at)
  on public.logged_bets to authenticated;

revoke all on public.saved_filters from anon, authenticated;
grant select, insert, delete on public.saved_filters to authenticated;

revoke all on public.alert_log from anon, authenticated;
grant select on public.alert_log to authenticated;

create or replace function public.set_initial_logged_bet_closing_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.market_id is null then
    new.closing_line_status := 'missed';
  else
    new.closing_line_status := 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists set_logged_bet_closing_status on public.logged_bets;
create trigger set_logged_bet_closing_status
  before insert on public.logged_bets
  for each row execute function public.set_initial_logged_bet_closing_status();

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null
);

create index if not exists idx_api_rate_limits_reset_at
  on public.api_rate_limits (reset_at);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;
grant all on public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_window_seconds integer,
  p_limit integer
)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_rate_key is null or length(p_rate_key) <> 64
    or p_window_seconds < 1 or p_limit < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits as limits
    (rate_key, window_started_at, request_count, reset_at)
  values
    (p_rate_key, v_now, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (rate_key) do update set
    window_started_at = case
      when limits.reset_at <= v_now then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.reset_at <= v_now then 1
      else limits.request_count + 1
    end,
    reset_at = case
      when limits.reset_at <= v_now
        then v_now + make_interval(secs => p_window_seconds)
      else limits.reset_at
    end
  returning limits.request_count, limits.reset_at
  into v_count, v_reset_at;

  if random() < 0.01 then
    with expired as (
      select rate_key
      from public.api_rate_limits
      where reset_at < v_now - interval '10 minutes'
      order by reset_at
      limit 500
    )
    delete from public.api_rate_limits as limits
    using expired
    where limits.rate_key = expired.rate_key;
  end if;

  return query
    select v_count <= p_limit, greatest(p_limit - v_count, 0), v_reset_at;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;