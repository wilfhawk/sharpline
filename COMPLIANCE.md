# Compliance & Payments Notes

Internal notes for the team before launch — not user-facing (see `/terms`,
`/privacy`, `/responsible-gambling` for the public-facing legal copy).

## Payments processor risk

Standard Stripe accounts may flag or reject gambling-odds-comparison businesses
under Stripe's prohibited/restricted business categories, even though this
product does not facilitate wagering itself (data/analysis only). Before
launch:

- Contact Stripe directly to confirm this specific business model (statistical
  odds comparison, no wagering) is acceptable under a standard account, or
- Budget time to onboard with a high-risk-friendly processor instead (e.g.
  Authorize.net, Paysafe) as a fallback if Stripe rejects or later suspends
  the account.

Do not assume the Stripe integration in this repo (test mode) implies
production approval — it only proves the checkout/webhook/portal flow works
technically.

## Odds data provider licensing

`lib/odds-provider.ts` currently ships only a mock/fixture provider. Before
wiring in a real provider (The Odds API, OpticOdds, SportsGameOdds, etc.):

- Confirm the provider's commercial license explicitly permits redistribution
  of their odds data inside a paid subscription product.
- Do not assume a free-tier or developer-tier ToS extends to a commercial,
  paid, multi-user product — most odds APIs price and license those
  separately and may prohibit redistribution outright on lower tiers.

## Geofencing

`middleware.ts` includes a `geoCheck()` hook that is a no-op today (always
allows). If legal counsel advises restricting access by state/country (common
for sports-betting-adjacent products in some US states), implement the real
check there — it already runs on every request before the Supabase session
refresh.
