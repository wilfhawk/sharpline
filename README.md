# SharpLine

A live dashboard that helps sports bettors find positive expected value
(+EV) betting opportunities by comparing U.S. sportsbook odds against a
de-vigged Pinnacle "fair odds" benchmark.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind v4, shadcn/ui (Base UI)
- PostgreSQL via Supabase (Auth + DB), Stripe (test mode), TanStack Query, Recharts
- Vitest + Testing Library for unit tests

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs on **mock
odds data** out of the box — no external credentials are required to explore
the dashboard, landing page, or legal pages.

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in real values to enable
the corresponding feature. Everything left blank degrades gracefully (auth
pages show a "not configured" message; the dashboard keeps working on mock
data; `middleware.ts` skips the Supabase session check entirely):

| Variable | Enables |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Auth (email + Google), the `users` profile table, RLS-protected market data |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PRICE_PRO` | Checkout, billing portal, and the subscription webhook (test mode) |
| `ODDS_PROVIDER` | Odds data source — `mock` (default) or `the-odds-api` (see below) |
| `ODDS_API_KEY` / `ODDS_API_SPORTS` / `ODDS_API_REGIONS` / `ODDS_API_CACHE_SECONDS` | Live odds via [The Odds API](https://the-odds-api.com), only used when `ODDS_PROVIDER=the-odds-api` |
| `AGE_GATE_MINIMUM` | Minimum age enforced by the signup age-gate modal (default 21) |

To wire up Supabase: run the SQL in `supabase/migrations/0001_init.sql`
against your project, then add `<your-domain>/api/auth/callback` as an
authorized redirect URI for the Google provider in your Supabase Auth
settings (see `app/api/auth/callback/route.ts`).

### Enabling live odds (The Odds API)

1. Sign up at [the-odds-api.com](https://the-odds-api.com) for a free API key
   (500 requests/month on the free tier).
2. Set `ODDS_PROVIDER=the-odds-api` and `ODDS_API_KEY=<your key>` in
   `.env.local`.
3. Optionally adjust `ODDS_API_SPORTS` (comma-separated
   [sport keys](https://the-odds-api.com/sports-odds-data/sports-apis.html),
   default `americanfootball_nfl,basketball_nba`) and `ODDS_API_REGIONS`
   (default `us,eu` — `eu` is required to get Pinnacle, the sharp reference
   book the EV engine devigs against).
4. `ODDS_API_CACHE_SECONDS` (default 60) controls how long Next.js caches
   each upstream request. The dashboard polls the app's own `/api/opportunities`
   every 20s regardless of provider, but that only re-hits The Odds API once
   the cache window expires — keep this well above 20s or you'll exhaust the
   free tier's monthly quota in minutes.
5. Markets with no Pinnacle quote at the same line are silently skipped (no
   fair-odds benchmark to devig against) — this is expected, not a bug.

See `lib/providers/the-odds-api-provider.ts` for the raw-response mapping and
`COMPLIANCE.md` before using this commercially (data licensing terms).

## Testing

```bash
npm run test           # run once
npm run test:watch     # watch mode
npm run test:coverage  # with coverage (lib/ target: >=80%)
```

The EV engine (`lib/ev-engine.ts`), odds conversions (`lib/odds-utils.ts`),
and the opportunity/gating glue (`lib/opportunities.ts`, `lib/subscription.ts`)
are unit tested with ~99% coverage.

## Project structure

- `lib/ev-engine.ts` — de-vig (multiplicative + power methods) and EV%
  calculation. Pure functions, the core IP of the product.
- `lib/odds-provider.ts` + `lib/providers/mock-provider.ts` +
  `lib/providers/the-odds-api-provider.ts` — swappable odds data source
  interface. `mock` (fixture data) and `the-odds-api` (live, via
  [The Odds API](https://the-odds-api.com)) are implemented; add another
  `OddsProvider` implementation (OpticOdds, SportsGameOdds, ...) the same way
  — see `COMPLIANCE.md` for licensing notes before doing so commercially.
- `lib/subscription.ts` — free tier (15-min delay, 3 opportunities/day) vs.
  pro tier gating logic.
- `supabase/migrations/0001_init.sql` — Postgres schema (users, sportsbooks,
  events, markets, odds_snapshots, ev_calculations) + RLS policies.
- `components/dashboard/` — the live opportunities table/cards, filter bar,
  and expandable row detail (per-book comparison + a synthetic demo price
  chart, since mock mode has no real historical snapshots yet).
- `components/auth/` — login/signup forms and the age/jurisdiction gate modal.
- `app/api/stripe/` — checkout, billing portal, and webhook routes (test mode).
- `middleware.ts` — Supabase session refresh + a no-op geofencing hook (see
  `COMPLIANCE.md`).

## Known limitations (as of this build)

- No real Supabase or Stripe project is connected yet, so auth, billing, and
  RLS-protected data paths are code-complete but not end-to-end verified —
  only unit-testable pure logic and the build/typecheck have been verified.
  The dashboard, landing page, and legal pages work fully on mock data with
  no credentials.
- A real, live odds provider (`the-odds-api`) is implemented but defaults to
  mock data — see "Enabling live odds" above. See `COMPLIANCE.md` before
  using a real, paid data feed commercially.
- Alert settings on the Account page are a UI stub with no backend yet.

See `COMPLIANCE.md` for payments-processor risk, data-licensing, and
geofencing notes that should be resolved before a real launch.

