# Connecting the real Odds API (The Odds API)

Right now SharpLine runs on `ODDS_PROVIDER=mock` (sample data). Follow these
steps to switch it to live odds from [The Odds API](https://the-odds-api.com).

## 1. Get a free API key

1. Go to [the-odds-api.com](https://the-odds-api.com) and sign up.
2. Free tier = 500 credits/month. Copy your API key from the account page.

## 2. Set it locally (`.env.local`)

Open `.env.local` in the project root (create it from `.env.local.example` if
it doesn't exist yet) and set:

```
ODDS_PROVIDER=the-odds-api
ODDS_API_KEY=<paste your key here>
ODDS_API_SPORTS=americanfootball_nfl,basketball_nba
ODDS_API_REGIONS=us,eu
ODDS_API_CACHE_SECONDS=3600
```

- `us,eu` for regions is required — `eu` is what gets you Pinnacle, the sharp
  book the EV engine de-vigs against. Don't drop it.
- `ODDS_API_CACHE_SECONDS=3600` (1hr) keeps free-tier testing well inside the
  500/month budget (~12 credits per refresh, ~41 refreshes/month available).
- Restart `npm run dev` after editing `.env.local` so Next.js picks it up.

## 3. Set it on Vercel (production)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → the
   `sharpline` project → **Settings → Environment Variables**.
2. Add the same variables as above (`ODDS_PROVIDER`, `ODDS_API_KEY`,
   `ODDS_API_SPORTS`, `ODDS_API_REGIONS`, `ODDS_API_CACHE_SECONDS`).
3. **Redeploy** (Deployments tab → ⋯ on the latest deployment → Redeploy) so
   the new env vars take effect — Vercel doesn't apply them to an already-built
   deployment automatically.

## 4. Verify it's working

- Locally: open `http://localhost:3000/dashboard` and check odds look like
  real current lines (not the same fixed mock numbers every time).
- Production: open `https://sharpline-nu.vercel.app/dashboard` after the
  redeploy finishes.
- If a market shows nothing, that's expected when no configured sharp book
  (`ODDS_API_SHARP_BOOKS`, default `pinnacle`) has posted a line for it yet —
  not a bug.

## Budget math (free tier, 500 credits/month)

Cost per refresh = `[sports] x [markets=3] x [regions]`. Default (2 sports,
2 regions) = 12 credits/refresh ≈ 41 refreshes/month. Track fewer sports or
drop a region to stretch the budget further — see `README.md` for the full
breakdown, optional `ODDS_API_EXTRA_MARKETS` (player props), and
`ODDS_API_SHARP_BOOKS` fallback chain.

See `COMPLIANCE.md` before using live odds data commercially (licensing terms).
