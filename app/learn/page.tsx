import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Calculator,
  LineChart,
  Repeat,
  Shuffle,
  Users,
} from "lucide-react";

const TOPICS = [
  {
    icon: LineChart,
    title: "De-vigging & fair odds",
    body: "Every sportsbook bakes a profit margin (the \"vig\") into its odds, so the implied probabilities on both sides of a bet add up to more than 100%. De-vigging strips that margin out to estimate the true, fair probability — SharpLine does this against a sharp reference book (Pinnacle, falling back to Circa or BetOnline) using either a proportional (multiplicative) or power-method split of the overround.",
  },
  {
    icon: Calculator,
    title: "Expected value (+EV)",
    body: "A bet is +EV when a book's price is better than the fair odds imply — over many bets at the same edge, you're mathematically favored to profit, even though any single bet can still lose. EV% quantifies the size of that edge; SharpLine ranks every book/side combination by it.",
  },
  {
    icon: Calculator,
    title: "Kelly Criterion stake sizing",
    body: "The Kelly Criterion computes the bankroll fraction that maximizes long-run growth given your edge and the offered odds. Full Kelly is high-variance, so most bettors (and SharpLine's default) use quarter-Kelly — a quarter of the full suggested stake — to smooth out swings.",
  },
  {
    icon: Repeat,
    title: "Arbitrage",
    body: "An arbitrage exists when the best price for each side of a market (at two different books) sums to less than 100% implied probability — betting both sides, sized proportionally, guarantees a profit regardless of the outcome. These are rare and close quickly once books notice.",
  },
  {
    icon: Shuffle,
    title: "Middles",
    body: "Distinct from arbitrage: a middle bets both sides of a market quoted at two different lines (e.g. Over 46 at one book, Under 48 at another). If the result lands in the window between the lines, both legs win — a bonus, not guaranteed. Outside the window, exactly one leg wins; SharpLine sizes the stakes so that outcome pays the same either way.",
  },
  {
    icon: LineChart,
    title: "Closing Line Value (CLV)",
    body: "CLV measures how your bet's price compared to the market's final (\"closing\") price right before the event started. Consistently beating the close is one of the strongest long-run signals of a profitable bettor, even independent of short-term results — SharpLine lets you log a bet and record its CLV once the line closes.",
  },
  {
    icon: Shuffle,
    title: "Same-game parlay (SGP) EV — simplified",
    body: "Parlaying correlated legs from the same game (e.g. \"Team A wins\" + \"Team A -3.5\") means their true joint probability is higher than if you just multiplied the individual probabilities together, since a win in one often implies the other. SharpLine's Parlay Builder lets you apply a manual correlation adjustment to approximate this — it's a rough estimate, not true correlation modeling, which would require a historical results dataset.",
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium">
          <BookOpen className="size-3.5" />
          SharpLine Academy
        </span>
        <h1 className="text-2xl font-semibold sm:text-3xl">
          Understand the math behind every edge
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Short explainers for the concepts SharpLine&apos;s dashboard is built on
          — so every number on the page means something concrete, not just a
          green badge to trust blindly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="gap-2 p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <h2 className="font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>

      <Card className="gap-2 p-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="size-5" />
        </span>
        <h2 className="font-medium">Community & leaderboards</h2>
        <p className="text-sm text-muted-foreground">
          On the roadmap, not live yet — we don&apos;t want to link you to a
          Discord or leaderboard that doesn&apos;t exist. When a real community
          space is set up, it&apos;ll be linked here.
        </p>
      </Card>

      <p className="text-xs text-muted-foreground">
        Educational content only — not betting advice. See our{" "}
        <Link href="/responsible-gambling" className="underline hover:text-foreground">
          Responsible Gambling
        </Link>{" "}
        resources.
      </p>
    </div>
  );
}
