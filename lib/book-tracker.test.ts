import { describe, expect, it } from "vitest";
import { activePromos, capStake, expiringSoon, isPromoExpired, parseTracker, type BookProfile, type Promo } from "./book-tracker";

const now = Date.parse("2026-10-12T12:00:00");
const promo = (overrides: Partial<Promo>): Promo => ({ id: "p", bookSlug: "draftkings", kind: "bonus_bet", title: "Bet $5 get $150", amount: 150, expiresOn: null, used: false, ...overrides });
const profile = (overrides: Partial<BookProfile>): BookProfile => ({ slug: "draftkings", balance: null, maxBet: null, status: "active", notes: "", ...overrides });

describe("capStake", () => {
  it("leaves untracked and active books alone", () => {
    expect(capStake(200, undefined)).toBe(200);
    expect(capStake(200, profile({ maxBet: 20 }))).toBe(200);
  });
  it("caps limited books at their max bet and zeroes closed books", () => {
    expect(capStake(200, profile({ status: "limited", maxBet: 25 }))).toBe(25);
    expect(capStake(10, profile({ status: "limited", maxBet: 25 }))).toBe(10);
    expect(capStake(200, profile({ status: "limited", maxBet: null }))).toBe(200);
    expect(capStake(200, profile({ status: "closed" }))).toBe(0);
  });
});

describe("promo dates", () => {
  it("treats a promo as live through the end of its expiry day", () => {
    expect(isPromoExpired(promo({ expiresOn: "2026-10-12" }), now)).toBe(false);
    expect(isPromoExpired(promo({ expiresOn: "2026-10-11" }), now)).toBe(true);
    expect(isPromoExpired(promo({ expiresOn: null }), now)).toBe(false);
  });
  it("lists only unused, unexpired promos for a book, soonest first", () => {
    const list = activePromos([
      promo({ id: "later", expiresOn: "2026-10-20" }),
      promo({ id: "soon", expiresOn: "2026-10-13" }),
      promo({ id: "none" }),
      promo({ id: "used", used: true }),
      promo({ id: "old", expiresOn: "2026-10-01" }),
      promo({ id: "other", bookSlug: "fanduel" }),
    ], "draftkings", now);
    expect(list.map((item) => item.id)).toEqual(["soon", "later", "none"]);
  });
  it("flags promos expiring within the window", () => {
    const soon = expiringSoon([promo({ id: "a", expiresOn: "2026-10-14" }), promo({ id: "b", expiresOn: "2026-10-30" }), promo({ id: "c", used: true, expiresOn: "2026-10-13" })], now, 3);
    expect(soon.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("parseTracker", () => {
  it("round-trips valid data", () => {
    const state = { books: [profile({ balance: 100 })], promos: [promo({})] };
    expect(parseTracker(JSON.stringify(state))).toEqual(state);
  });
  it("falls back to empty on missing, malformed, or invalid data", () => {
    for (const raw of [null, "", "{oops", JSON.stringify({ books: [{ slug: "x" }], promos: [] }), JSON.stringify({ books: [profile({ maxBet: -5 })], promos: [] })]) {
      expect(parseTracker(raw)).toEqual({ books: [], promos: [] });
    }
  });
});
