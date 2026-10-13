import { z } from "zod";

export const PROMO_KINDS = ["bonus_bet", "profit_boost", "deposit_match", "risk_free"] as const;
export type PromoKind = (typeof PROMO_KINDS)[number];
export const PROMO_LABELS: Record<PromoKind, string> = {
  bonus_bet: "Bonus bet",
  profit_boost: "Profit boost",
  deposit_match: "Deposit match",
  risk_free: "Risk-free bet",
};

export const BOOK_STATUSES = ["active", "limited", "closed"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

const money = z.number().finite().min(0).max(10_000_000);

export const bookProfileSchema = z.object({
  slug: z.string().min(1).max(60),
  balance: money.nullable(),
  /** Largest stake this book will currently accept, once the account has been limited. */
  maxBet: money.nullable(),
  status: z.enum(BOOK_STATUSES),
  notes: z.string().max(300),
});
export type BookProfile = z.infer<typeof bookProfileSchema>;

export const promoSchema = z.object({
  id: z.string().min(1).max(60),
  bookSlug: z.string().min(1).max(60),
  kind: z.enum(PROMO_KINDS),
  title: z.string().min(1).max(100),
  amount: money,
  /** Local calendar date, YYYY-MM-DD. */
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  used: z.boolean(),
});
export type Promo = z.infer<typeof promoSchema>;

export const trackerStateSchema = z.object({
  books: z.array(bookProfileSchema).max(50),
  promos: z.array(promoSchema).max(200),
});
export type TrackerState = z.infer<typeof trackerStateSchema>;

export const EMPTY_TRACKER: TrackerState = { books: [], promos: [] };

/** Corrupt or hand-edited storage falls back to an empty tracker instead of breaking the page. */
export function parseTracker(raw: string | null): TrackerState {
  if (!raw) return EMPTY_TRACKER;
  try {
    const parsed = trackerStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_TRACKER;
  } catch {
    return EMPTY_TRACKER;
  }
}

/** A closed account can't be bet; a limited one is capped at its max bet when one is set. */
export function capStake(stake: number, profile: BookProfile | undefined): number {
  if (!profile) return stake;
  if (profile.status === "closed") return 0;
  if (profile.status === "limited" && profile.maxBet !== null) return Math.min(stake, profile.maxBet);
  return stake;
}

function endOfDay(date: string): number {
  return Date.parse(`${date}T23:59:59`);
}

export function isPromoExpired(promo: Promo, now = Date.now()): boolean {
  return promo.expiresOn !== null && endOfDay(promo.expiresOn) < now;
}

/** Unused, unexpired promos for one book, soonest expiry first. */
export function activePromos(promos: Promo[], bookSlug: string, now = Date.now()): Promo[] {
  return promos
    .filter((promo) => promo.bookSlug === bookSlug && !promo.used && !isPromoExpired(promo, now))
    .sort((a, b) => (a.expiresOn ?? "9999-12-31").localeCompare(b.expiresOn ?? "9999-12-31"));
}

/** Unused promos that expire within `days`, so they get used before they lapse. */
export function expiringSoon(promos: Promo[], now = Date.now(), days = 3): Promo[] {
  const horizon = now + days * 86_400_000;
  return promos
    .filter((promo) => !promo.used && promo.expiresOn !== null && !isPromoExpired(promo, now) && endOfDay(promo.expiresOn) <= horizon)
    .sort((a, b) => a.expiresOn!.localeCompare(b.expiresOn!));
}
