# SharpLine

A live dashboard that helps sports bettors find positive expected value
(+EV) betting opportunities by comparing U.S. sportsbook odds against a
de-vigged sharp-book (Pinnacle, with Circa/BetOnline fallback) "fair odds"
benchmark. Also finds cross-book arbitrage, middles, and estimates same-game
parlay EV; tracks Kelly stake sizing, CLV, and live/in-play edges.

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
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Checkout, billing portal, and the subscription webhook (test mode) |
| `NEXT_PUBLIC_STRIPE_PRICE_PLUS_MONTHLY` / `_ANNUAL` / `_PRO_MONTHLY` / `_PRO_ANNUAL` | The 4 Stripe Prices backing the Plus/Pro × monthly/annual checkout options (see below) |
| `ODDS_PROVIDER` | Odds data source — `mock` (default) or `the-odds-api` (see below) |
| `ODDS_API_KEY` / `ODDS_API_SPORTS` / `ODDS_API_REGIONS` / `ODDS_API_CACHE_SECONDS` | Live odds via [The Odds API](https://the-odds-api.com), only used when `ODDS_PROVIDER=the-odds-api` |
| `ODDS_API_EXTRA_MARKETS` | Opt-in player-prop market keys added to the same bulk odds call (e.g. `player_pass_tds,player_points`); adds to per-refresh credit cost |
| `ODDS_API_SHARP_BOOKS` | Priority-ordered sharp reference bookmaker keys (default `pinnacle`), e.g. `pinnacle,circasports,betonlineag` — the engine falls back to the next book in the list when a higher-priority one hasn't posted a line for a market |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Email alerts (`app/api/cron/alerts`) via [Resend](https://resend.com); alerts silently no-op when unset |
| `CRON_SECRET` | Protects `/api/cron/*` routes — Vercel sends it automatically as a Bearer token once set, see `vercel.json` |
| `AGE_GATE_MINIMUM` | Minimum age enforced by the signup age-gate modal (default 21) |

To wire up Supabase: run the SQL in `supabase/migrations/0001_init.sql`,
`0002_user_extensions.sql`, `0003_plus_tier_alerts_clv.sql`, and
`0004_launch_hardening.sql` (in that order) against your project, then add `<your-domain>/api/auth/callback` as an
authorized redirect URI for the Google provider in your Supabase Auth
settings (see `app/api/auth/callback/route.ts`).

### Setting up Plus/Pro billing (Stripe)

1. In the Stripe **test mode** dashboard, create 2 Products: "SharpLine Plus"
   and "SharpLine Pro".
2. Add 2 recurring Prices to each (USD): a monthly price, and an annual price
   at 10x the monthly amount (2 months free) — e.g. Plus $25/mo + $250/yr,
   Pro $49/mo + $490/yr.
3. Copy each Price ID into the 4 `NEXT_PUBLIC_STRIPE_PRICE_*` env vars above.
4. The existing `/api/stripe/webhook` automatically maps whichever Price a
   customer checks out with back to the right tier — no code changes needed
   when prices change, just update the env vars.

### Setting up email alerts (Resend + Vercel Cron)

1. Sign up at [resend.com](https://resend.com), verify a sending domain (or
   use their shared test domain for development), and create an API key.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in your environment.
3. `vercel.json` schedules alerts daily at 15:00 UTC and closing-line capture
   daily at 00:00 UTC, which is compatible with Vercel Hobby's once-daily cron
   limit. On Vercel Pro, you can change these schedules to every 15 minutes
   and hourly respectively for timely alerts and near-kickoff CLV capture.
4. Set a `CRON_SECRET` env var (any random string) so only Vercel's own cron
   invocations can trigger these routes.

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
4. `ODDS_API_CACHE_SECONDS` (default 3600) controls how long Next.js caches
   each upstream request. The dashboard polls the app's own `/api/opportunities`
   every 20s regardless of provider, but that only re-hits The Odds API once
   the cache window expires.
5. Markets with no quote from any configured sharp reference book are
   silently skipped (no fair-odds benchmark to devig against) — this is
   expected, not a bug. Add more sharp books as a fallback chain via
   `ODDS_API_SHARP_BOOKS` (e.g. `pinnacle,circasports,betonlineag`) so a
   market missing Pinnacle can still be devigged against Circa or BetOnline.
6. For broader book coverage, add the `us2` region (alongside `us`/`eu`) to
   `ODDS_API_REGIONS` — it adds books like BetRivers, Circa, BetOnline, and
   others not in the default `us` region. More regions/sports/markets cost
   more credits per refresh (see the budget math below), so a bigger plan is
   usually needed for full 20+ book coverage across many sports.

**Free-tier budget (500 credits/month):** cost per refresh is
`[sports] x [markets=3] x [regions]`. With the default 2 sports and 2 regions
(`us,eu`), that's 12 credits per refresh — about 41 refreshes/month. The
default `ODDS_API_CACHE_SECONDS=3600` (1hr) keeps a testing session well
within quota; repeated dashboard reloads inside that hour are served from
cache for free. Track fewer sports or drop a region to fit more refreshes in
the same budget (dropping `eu` disables the EV engine's Pinnacle benchmark,
so prefer trimming `ODDS_API_SPORTS` first).

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
- `lib/middles.ts` + `components/dashboard/MiddlesList.tsx` — finds a middle
  when the same event's total is quoted at two different lines (bet Over the
  lower line at one book, Under the higher line at another); profit isn't
  guaranteed like arbitrage, only when the result lands in the window.
- `lib/sgp.ts` + `components/dashboard/SgpBuilder.tsx` — same-game parlay EV
  estimator. **v1 simplified heuristic**: assumes independence between legs
  then scales by a user-supplied `correlationFactor`, since true
  correlation/copula modeling needs a historical results dataset this app
  doesn't have yet. Treat the output as a rough guide, not a precise edge.
- `lib/live.ts` — live/in-play helpers; `useOpportunities` polls every 8s
  (instead of 20s) whenever a live opportunity is present, since in-play
  lines move fastest.
- `extension/` — a minimal browser-extension scaffold (Manifest V3). **Scope
  cut**: it's a clipboard "copy formatted bet" bridge, not real per-sportsbook
  bet-slip auto-fill — every book's bet-slip DOM is different and changes
  often, so guessing selectors would be fragile and likely wrong. See
  `extension/README.md` for what it does today and how to extend it.
- `app/learn/` — educational content (Kelly Criterion, CLV, de-vigging,
  arbitrage, middles, parlay EV) for content marketing / user education.

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

