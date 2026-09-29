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
| `ODDS_PROVIDER` | Odds data source — only `mock` is implemented today (see `lib/odds-provider.ts`) |
| `AGE_GATE_MINIMUM` | Minimum age enforced by the signup age-gate modal (default 21) |

To wire up Supabase: run the SQL in `supabase/migrations/0001_init.sql`
against your project, then add `<your-domain>/api/auth/callback` as an
authorized redirect URI for the Google provider in your Supabase Auth
settings (see `app/api/auth/callback/route.ts`).

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
- `lib/odds-provider.ts` + `lib/providers/mock-provider.ts` — swappable odds
  data source interface. Only a mock/fixture provider is implemented; swap in
  a real API (The Odds API, OpticOdds, SportsGameOdds) by adding a new
  `OddsProvider` implementation — see `COMPLIANCE.md` for licensing notes
  before doing so commercially.
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
- The odds provider is mock-only; see `COMPLIANCE.md` before adding a real,
  paid data feed.
- Alert settings on the Account page are a UI stub with no backend yet.

See `COMPLIANCE.md` for payments-processor risk, data-licensing, and
geofencing notes that should be resolved before a real launch.

