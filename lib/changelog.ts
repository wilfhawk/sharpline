export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  items: string[];
}

/** Add a new entry to the TOP of this array whenever you ship something user-visible. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-10-12",
    title: "All games, earnings calculator, player props, and promo tools",
    items: [
      "Added All Games: browse every game by sport, league, and status and compare prices, whether or not there is an edge",
      "Added the Earnings & Risk calculator under Learn, with a 95% outcome range and chance of a net loss after costs",
      "Added the Promo Converter for bonus bets, profit boosts, risk-free bets, and deposit matches",
      "Added My Books to track balances, bet limits, and promos; suggested stakes now respect a book's limit",
      "Added Bet links to the sportsbook on each opportunity",
      "Added player props, scored against the consensus of the other books (see Methodology)",
      "My Bets now tracks results with profit, ROI, and a chart of actual versus expected profit",
      "The landing page now shows today's free picks from the live feed",
    ],
  },
  {
    date: "2026-10-11",
    title: "More sports and a Pro de-vig model picker",
    items: [
      "Expanded tracked sports from NFL/NBA to also include MLB, NHL, and NCAAF (college football)",
      "Added a Pro-only choice of de-vig model (multiplicative or power) used to compute fair odds",
    ],
  },
  {
    date: "2026-10-01",
    title: "Plus tier, alerts, automated CLV, and trust pages",
    items: [
      "Added a new Plus tier ($25/mo) between Free and Pro, with monthly and annual (2-months-free) billing",
      "Fixed live odds data (The Odds API region configuration) and a subscription-tier gating bug that let every visitor see the full Pro experience",
      "Added email alerts for saved +EV filters (Plus/Pro) and all arbitrage/middles (Pro), with 30-minute dedup",
      "Automated Closing Line Value capture near kickoff instead of relying on manual entry, with a clear pending/captured/missed status per bet",
      "Added inline tooltips for EV%, Fair Odds, Kelly stake, and CLV, plus a \"Show the math\" breakdown and an SGP EV accuracy disclaimer",
      "Added /methodology, /status, and this /changelog page",
    ],
  },
  {
    date: "2026-09-30",
    title: "Marketing polish, live/in-play EV, middles, and SGP builder",
    items: [
      "Added landing-page comparison table and ROI calculator",
      "Added live/in-play EV detection with faster polling during live games",
      "Added middles detection and a multi-sharp-book fallback (Pinnacle → Circa → BetOnline)",
      "Added the same-game parlay (SGP) EV builder and a browser-extension bet-copy bridge",
      "Added the /learn educational content hub",
    ],
  },
  {
    date: "2026-09-29",
    title: "Initial launch",
    items: [
      "Core +EV dashboard comparing sportsbook odds against de-vigged Pinnacle fair odds",
      "Supabase auth (email + Google) and Stripe billing (test mode)",
      "Arbitrage detection, Kelly stake sizing, CLV bet tracking, saved filter presets, and opportunity alerts (local, pre-email)",
    ],
  },
];
