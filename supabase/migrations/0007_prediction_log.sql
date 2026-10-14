-- Prediction log: first model estimate per market side, scored later against the closing line.

create table public.prediction_log (
  id bigint generated always as identity primary key,
  market_id text not null,
  side text not null check (side in ('A', 'B')),
  model_version text not null,
  sport text,
  event_start_time timestamptz not null,
  reference_probability numeric not null check (reference_probability > 0 and reference_probability < 1),
  model_probability numeric not null check (model_probability > 0 and model_probability < 1),
  features jsonb not null,
  created_at timestamptz not null default now(),
  closing_fair_probability numeric check (closing_fair_probability > 0 and closing_fair_probability < 1),
  closing_captured_at timestamptz,
  unique (market_id, side, model_version)
);
create index prediction_log_unscored on public.prediction_log(event_start_time) where closing_fair_probability is null;
create index prediction_log_scored on public.prediction_log(model_version, event_start_time) where closing_fair_probability is not null;

alter table public.prediction_log enable row level security;
revoke all on public.prediction_log from anon, authenticated;
grant all on public.prediction_log to service_role;
grant usage, select on sequence public.prediction_log_id_seq to service_role;
