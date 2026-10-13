-- Track bet outcomes so realized profit can be compared with expected value.

alter table public.logged_bets add column if not exists result text
  check (result in ('win', 'loss', 'push', 'void'));
alter table public.logged_bets add column if not exists settled_at timestamptz;

grant update (result, settled_at) on public.logged_bets to authenticated;
