export interface KnownBook {
  slug: string;
  name: string;
  /** Public home page, used when the odds feed has no betslip deep link. */
  site: string;
  /** Whether it belongs in the "my books" tracker (sharp reference books are not tracked). */
  trackable: boolean;
}

export const KNOWN_BOOKS: KnownBook[] = [
  { slug: "draftkings", name: "DraftKings", site: "https://sportsbook.draftkings.com/", trackable: true },
  { slug: "fanduel", name: "FanDuel", site: "https://sportsbook.fanduel.com/", trackable: true },
  { slug: "betmgm", name: "BetMGM", site: "https://sports.betmgm.com/", trackable: true },
  { slug: "caesars", name: "Caesars", site: "https://sportsbook.caesars.com/", trackable: true },
  { slug: "williamhill_us", name: "William Hill (US)", site: "https://sportsbook.caesars.com/", trackable: true },
  { slug: "betrivers", name: "BetRivers", site: "https://www.betrivers.com/", trackable: true },
  { slug: "espnbet", name: "ESPN BET", site: "https://espnbet.com/", trackable: true },
  { slug: "fanatics", name: "Fanatics", site: "https://sportsbook.fanatics.com/", trackable: true },
  { slug: "hardrockbet", name: "Hard Rock Bet", site: "https://www.hardrock.bet/", trackable: true },
  { slug: "ballybet", name: "Bally Bet", site: "https://play.ballybet.com/", trackable: true },
  { slug: "pointsbetus", name: "PointsBet (US)", site: "https://pointsbet.com/", trackable: true },
  { slug: "bovada", name: "Bovada", site: "https://www.bovada.lv/sports", trackable: true },
  { slug: "betonlineag", name: "BetOnline.ag", site: "https://www.betonline.ag/sportsbook", trackable: true },
  { slug: "betonline", name: "BetOnline", site: "https://www.betonline.ag/sportsbook", trackable: false },
  { slug: "circa", name: "Circa Sports", site: "https://www.circasports.com/", trackable: false },
  { slug: "pinnacle", name: "Pinnacle", site: "https://www.pinnacle.com/", trackable: false },
];

const BY_SLUG = new Map(KNOWN_BOOKS.map((book) => [book.slug, book]));

export function bookSiteUrl(slug: string): string | undefined {
  return BY_SLUG.get(slug)?.site;
}

export function bookName(slug: string): string {
  return BY_SLUG.get(slug)?.name ?? slug;
}
