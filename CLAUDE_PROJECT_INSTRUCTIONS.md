# SharpLine: Claude Project pack

Paste Part 1 into the Claude Project's custom instructions. Upload Parts 2-4 (or this whole file) as project knowledge. Pricing was checked on 2026-10-14; confirm before committing money.

---

## Part 1. Custom instructions (paste this)

You are helping me finish and launch SharpLine, a sports-betting +EV and odds-comparison web app. It provides data and analysis only and never handles wagers or funds.

How to work with me:
- Keep answers short and concrete. Give the next action first, then the reason.
- Track the checklist in Part 3. When I say something is done, tick it and tell me what is now unblocked.
- Before suggesting a paid service, show the monthly cost and the cheapest option that works.
- Never ask me to paste secrets (API keys, service-role key, Stripe secret) into the chat. Tell me which env var to set and where.
- Flag compliance risk (age gate, state rules, responsible-gambling copy, no guarantees of profit) whenever a change touches marketing or payments.
- Prices and plan limits change. Mark any cost you are unsure of as "verify".

Project facts:
- Stack: Next.js 16 (App Router, breaking changes vs older versions; read `node_modules/next/dist/docs/` before coding), React 19, TypeScript, Tailwind v4, Supabase (auth + Postgres), Stripe, Resend, The Odds API, Gemini (optional), deployed on Vercel.
- Repo: `C:\Scripts\sharpline`. Commands: `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npx playwright test`.
- Tiers: Free (delayed, 3 picks/day), Plus ($25/mo), Pro ($49/mo). Plus adds live feed, alerts and a model badge. Pro adds arbitrage, middles, SGP, de-vig model picker, model probability, "model agrees" filter and alerts, AI explanations.
- `NEXT_PUBLIC_ENABLE_TIER_PREVIEW=true` shows landing-page demo buttons, the header plan toggle and lets `?tier=` override the plan. It must be false/unset in production. It is read at build time.
- Corporate-network note: this dev machine blocks The Odds API (TLS interception) and Gemini (Netskope). Test those off-network or on Vercel. Local `ODDS_PROVIDER=mock`.

---

## Part 2. What is built

- +EV engine: de-vigged sharp-book (Pinnacle first) fair odds, multiplicative and power methods, player props via market consensus.
- Dashboard: league and sportsbook multi-select profile (empty = all, saved on device and to the account), filters, "all best odds" option.
- All Games and per-game prediction pages (`/games/[eventId]`), predictions shown even without an edge.
- Experimental AI model: market-anchored, hand-set weights (`v0-prior`, not trained), Gemini-written explanations with a template fallback, prediction log and closing-line scorecard on `/methodology`.
- Arbitrage, middles, SGP, stake sizing, promo converter, My Books tracker, My Bets with CLV and results, earnings calculator.
- Email alerts (Resend), Stripe checkout/portal/webhook, Supabase auth, age gate, legal pages, changelog.
- Tests: 225 unit tests, 11 Playwright tests. Build and lint pass.

---

## Part 3. To-do list

Order matters: do each phase before the next.

### Phase A. Code housekeeping (free)
- [ ] Review and commit the large uncommitted change set (feature work from 2026-10-12 onward). Push to GitHub.
- [ ] Add a CI run of `npm test`, `npm run lint`, `npm run build` (GitHub Actions free tier).

### Phase B. Database (Supabase)
- [ ] Confirm migrations `0005_product_reliability.sql` and `0006_bet_results.sql` are applied.
- [ ] Apply `0007_prediction_log.sql` (prediction log + scorecard).
- [ ] Apply `0008_dashboard_profiles.sql` (account-synced dashboard profile).
- [ ] Run `supabase/tests/access.sql` and confirm RLS blocks cross-user access.
- [ ] Decide Free vs Pro plan (see costs; Free pauses after 1 week of inactivity and has no backups).

### Phase C. Live data (The Odds API)
- [ ] Choose a plan that matches your refresh rate (see credit math below).
- [ ] Set `ODDS_PROVIDER=the-odds-api`, `ODDS_API_KEY`, `ODDS_API_CACHE_SECONDS` (default 172800 is for the free tier only; use 300 to 900 for live use).
- [ ] Decide on player props (`ODDS_API_PROPS=true` multiplies credit use).
- [ ] Verify on Vercel (not on the corporate network) that the feed loads and `/status` is healthy.

### Phase D. Scheduling
- [ ] `/api/cron/ingest` is not in `vercel.json`. Schedule it, or snapshots only refresh when a user visits and the prediction log never fills.
- [ ] Vercel Hobby cron is once per day only. For 15-minute alerts and ingest use Vercel Pro, or a free external scheduler (for example cron-job.org) calling the routes with the `CRON_SECRET` bearer token.
- [ ] Confirm `/api/cron/alerts`, `/api/cron/capture-closing-lines` and `/api/cron/score-predictions` run and return 200.

### Phase E. Email (Resend)
- [ ] Add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET` to Vercel.
- [ ] Buy a domain, verify it in Resend (SPF, DKIM, DMARC), and switch from `onboarding@resend.dev`.
- [ ] Send a real alert email end to end and test the unsubscribe link.

### Phase F. Payments (Stripe)
- [ ] Finish Stripe account activation (business details, bank account).
- [ ] Create live-mode products and prices for Plus/Pro, monthly and annual. Update the four `NEXT_PUBLIC_STRIPE_PRICE_*` vars.
- [ ] Create the live webhook endpoint (`/api/stripe/webhook`), set `STRIPE_WEBHOOK_SECRET`, and swap `STRIPE_SECRET_KEY` to live.
- [ ] Run a real small purchase and refund to verify the tier changes, then test cancel via the billing portal.
- [ ] Decide on sales tax handling (Stripe Tax or manual).

### Phase G. AI features
- [ ] On a personal network, set `GEMINI_API_KEY` and confirm explanations come back with source "gemini".
- [ ] Let the prediction log collect data for several weeks, then review the scorecard.
- [ ] Once there is enough data, fit real weights and bump `MODEL_VERSION`. Add a game-results source if you want win/loss accuracy.
- [ ] Keep "experimental" labelling until the scorecard supports stronger claims.

### Phase H. Legal and compliance
- [ ] Have a lawyer review Terms, Privacy and Responsible Gambling pages, the age gate (21+), and any affiliate or "betting advice" language.
- [ ] Check state-by-state rules for gambling-related information services and any affiliate links.
- [ ] Confirm the responsible-gambling footer and helpline appear on every page.
- [ ] Prepare a data-deletion and account-deletion process.

### Phase I. Launch switch
- [ ] On the production deployment set `NEXT_PUBLIC_ENABLE_TIER_PREVIEW=false` (or remove it), then redeploy. Confirm the landing demo buttons, header toggle and `?tier=` override are gone.
- [ ] Set all env vars on Vercel: Supabase URL/anon/service role, Stripe, Resend, `CRON_SECRET`, Odds API, Gemini, `AGE_GATE_MINIMUM`.
- [ ] Point the custom domain at Vercel; confirm HTTPS.
- [ ] Smoke test as anonymous (Free), signed-in Free, Plus and Pro with real accounts.
- [ ] Re-screenshot mobile (375px) for header, dashboard and game page.

### Phase J. After launch
- [ ] Add error monitoring (Sentry free tier) and an uptime check on `/api/health`.
- [ ] Watch Odds API credit use weekly; adjust cache seconds or sports.
- [ ] Review the scorecard monthly.

---

## Part 4. Costs

All prices USD, monthly unless stated. Sources: Vercel, Supabase and Resend pricing pages (checked 2026-10-14). The Odds API figures are from memory and could not be fetched: verify at the-odds-api.com.

### Service costs

| Item | Free / testing | Launch recommendation | Notes |
| --- | --- | --- | --- |
| Vercel | Hobby $0 (personal, non-commercial only) | Pro $20 per developer seat | A paid product needs Pro. Pro includes $20 usage credit. Hobby cron is daily only. |
| Supabase | Free $0 (500 MB, pauses after 1 week idle, no backups) | Pro $25 (8 GB, daily backups, no pausing; includes a $10 compute credit) | Extra compute or disk beyond included is metered. |
| The Odds API (verify) | Free: 500 credits | About $30 (20K credits) or $59 (100K credits) | See credit math. Higher tiers exist for faster refresh. |
| Resend | Free: 3,000 emails/mo, 100/day | Free until volume grows; Pro $20 (50,000/mo) | Free is capped at 100 emails per day. Alerts to many users hit that quickly. |
| Gemini API | Free tier available | About $0 to $5 (estimate) | Explanations are short and cached 15 minutes per opportunity. Check current pricing. |
| Stripe | No monthly fee | 2.9% + $0.30 per card payment (verify) | About $1.03 on Plus and $1.72 on Pro per month. |
| Domain | none | About $12 to $20 per year | Required to verify Resend and for production. |
| Legal review | none | One-time, roughly $500 to $3,000+ (estimate) | Varies widely by firm and scope. |
| Sentry / uptime monitoring | Free tiers | $0 | Optional. |

### The Odds API credit math

Per the repo setup guide, 5 sports x 3 markets x 2 regions = 30 credits per refresh. Props add roughly 3 credits per game per refresh.

| Refresh interval (continuous traffic) | Refreshes/mo | Credits/mo | Plan needed |
| --- | --- | --- | --- |
| Every 2 days (current default) | ~15 | ~450 | Free (500) |
| Every 60 minutes | ~720 | ~21,600 | About 100K plan (20K is just short) |
| Every 15 minutes | ~2,880 | ~86,400 | 100K plan |
| Every 5 minutes | ~8,640 | ~259,000 | A multi-million credit plan |

Lever: `ODDS_API_CACHE_SECONDS`. Fewer sports or one region cuts credits proportionally. Turning props on increases them.

### Monthly totals

| Stage | Setup | Monthly | Includes |
| --- | --- | --- | --- |
| Testing (now) | $0 | $0 | Vercel Hobby, Supabase Free, mock odds, Resend Free |
| Soft launch | About $15/yr domain | About $75 to $80 | Vercel Pro $20, Supabase Pro $25, Odds API $30 |
| Production | Domain + legal review | About $105 to $120 | Vercel Pro $20, Supabase Pro $25, Odds API $59, Resend Free, Gemini $0 to $5 |
| Growth | none | $125+ | Adds Resend Pro $20 when alerts exceed free limits |

### Break-even (production stage, about $110/mo fixed)

| Mix | Subscribers needed |
| --- | --- |
| Pro only ($49, about $47.28 net of fees) | 3 |
| Plus only ($25, about $23.97 net of fees) | 5 |

This excludes legal costs, taxes, refunds and your time. Add a buffer for churn.

### One-time and annual costs
- Domain: about $12 to $20 per year.
- Legal review: roughly $500 to $3,000+ one time (estimate), then periodic updates.
- Optional: Stripe Tax, accountant, business registration (varies by state).

---

## Part 5. Known gotchas
- Resend free plan: 100 emails/day, so alerts to a growing list need Pro.
- The prediction scorecard only fills if ingest runs regularly and snapshots exist near kickoff. Snapshot retention is 7 days.
- Model weights are placeholders. Do not market the model as accurate until the scorecard says so.
- The corporate network blocks Odds API and Gemini locally; failures there are not code bugs.
- A second `next dev` in the same folder can conflict with an existing one.
- Changing `NEXT_PUBLIC_*` vars needs a rebuild or redeploy to take effect.
