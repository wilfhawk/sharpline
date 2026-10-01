export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  items: string[];
}

/** Add a new entry to the TOP of this array whenever you ship something user-visible. */
export const CHANGELOG: ChangelogEntry[] = [
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
