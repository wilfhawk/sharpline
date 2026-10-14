"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SubscriptionTier } from "@/lib/types";

type Cell = boolean | string;
type Interval = "month" | "year";

interface Plan {
  tier: SubscriptionTier;
  name: string;
  monthly: string;
  annual: string;
  tagline: string;
  bestFor: string;
  highlights: string[];
}

const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    monthly: "$0",
    annual: "$0",
    tagline: "See how it works",
    bestFor: "Trying SharpLine and placing the odd bet.",
    highlights: ["3 best bets a day", "Odds delayed 15 minutes", "Browse every game"],
  },
  {
    tier: "plus",
    name: "Plus",
    monthly: "$25",
    annual: "$20.83",
    tagline: "Live bets, alerts, and the AI check",
    bestFor: "Regular bettors who want every edge as it appears.",
    highlights: ["Unlimited best bets, live", "Email alerts", "Compare every sportsbook's price", "AI model badge on every bet"],
  },
  {
    tier: "pro",
    name: "Pro",
    monthly: "$49",
    annual: "$40.83",
    tagline: "Everything, including the full AI model",
    bestFor: "Serious bettors who want every tool and the reasoning behind each pick.",
    highlights: ["Everything in Plus", "Arbitrage, middles and parlay tools", "Full AI model with plain-English explanations", "Line movement history"],
  },
];

interface Row {
  label: string;
  help?: string;
  values: [Cell, Cell, Cell];
}

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Bets and data",
    rows: [
      { label: "How fresh the odds are", values: ["15 min delay", "Live", "Live"] },
      { label: "Best bets shown per day", values: ["3", "Unlimited", "Unlimited"] },
      { label: "Browse every game and market", values: [true, true, true] },
      { label: "Prices from every sportsbook for each market", values: [false, true, true] },
      { label: "Dashboard built around your sports and sportsbooks", values: [true, true, true] },
      { label: "Line movement history", help: "See how a price has moved over time.", values: [false, false, true] },
    ],
  },
  {
    title: "Alerts",
    rows: [
      { label: "Email alerts for new best bets", values: [false, true, true] },
      { label: "Alerts for arbitrage and middles", values: [false, false, true] },
      { label: "Alerts only when the AI model agrees", values: [false, false, true] },
    ],
  },
  {
    title: "AI model (experimental)",
    rows: [
      { label: "Model agrees / neutral / disagrees badge", values: [false, true, true] },
      { label: "Model win chance and edge for every bet", values: [false, false, true] },
      { label: "Filter to bets the model agrees with", values: [false, false, true] },
      { label: "Plain-English explanation of each pick", help: "Written by Gemini AI from the numbers, never from outside news.", values: [false, false, true] },
      { label: "Predictions for any game, even with no edge", values: [false, "Agree / disagree only", "Full detail"] },
    ],
  },
  {
    title: "Advanced tools",
    rows: [
      { label: "Arbitrage finder", help: "Lock in a profit by betting both sides at different books.", values: [false, false, true] },
      { label: "Middles finder", help: "Bet both sides of a line so you can win both.", values: [false, false, true] },
      { label: "Same-game parlay edge estimator", values: [false, false, true] },
      { label: "Choice of two methods for the true odds", values: [false, false, true] },
    ],
  },
  {
    title: "Included with every plan",
    rows: [
      { label: "Stake sizing (Kelly)", values: [true, true, true] },
      { label: "Promo and bonus-bet converter", values: [true, true, true] },
      { label: "My Books: balances, limits and promos", values: [true, true, true] },
      { label: "Bet tracker with closing line value", values: [true, true, true] },
      { label: "Earnings calculator and learning guides", values: [true, true, true] },
    ],
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What is a \"best bet\" or edge?",
    a: "It is a bet where a sportsbook pays more than the bet should pay. We work out the true odds from Pinnacle, the bookmaker sharp bettors trust most, with its built-in fee removed. The edge is how much better the sportsbook's price is than that. Over many bets, a positive edge is profitable on average, but any single bet can still lose.",
  },
  {
    q: "Do you place bets for me or hold my money?",
    a: "No. SharpLine is data and analysis only. You place every bet yourself at your own sportsbook.",
  },
  {
    q: "How accurate is the AI model?",
    a: "It is experimental. It starts from the market's own prices and nudges them using a few signals, and we publish how it has done on the Methodology page. Treat it as a second opinion, not a prediction you can rely on.",
  },
  {
    q: "Can I switch plans or cancel?",
    a: "Yes. Upgrade, downgrade or cancel at any time from Account, Manage billing. There is no lock-in contract.",
  },
  {
    q: "What does annual billing save?",
    a: "Two months free compared with paying monthly.",
  },
  {
    q: "Do you guarantee profit?",
    a: "No. Betting involves risk and past results do not guarantee future results. Only bet what you can afford to lose. See our Responsible Gambling page for help.",
  },
];

function CellView({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto size-4 text-emerald-400" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto size-4 text-muted-foreground/40" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-xs font-medium sm:text-sm">{value}</span>;
}

export function PlansPage({ signedIn, currentTier }: { signedIn: boolean; currentTier: SubscriptionTier }) {
  const [interval, setInterval] = useState<Interval>("year");
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(tier: "plus" | "pro") {
    setLoadingTier(tier);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
      window.location.href = body.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setLoadingTier(null);
    }
  }

  function planButton(plan: Plan) {
    const highlighted = plan.tier === "pro";
    if (signedIn && currentTier === plan.tier) {
      return <Button variant="outline" className="w-full" disabled>Your current plan</Button>;
    }
    if (plan.tier === "free") {
      return (
        <Button variant="outline" className="w-full" nativeButton={false} render={<Link href={signedIn ? "/dashboard" : "/signup"} />}>
          {signedIn ? "Open dashboard" : "Start free"}
        </Button>
      );
    }
    if (!signedIn) {
      return (
        <Button variant={highlighted ? "default" : "outline"} className="w-full" nativeButton={false} render={<Link href="/signup" />}>
          Create account to upgrade
        </Button>
      );
    }
    return (
      <Button
        variant={highlighted ? "default" : "outline"}
        className="w-full"
        disabled={loadingTier !== null}
        onClick={() => checkout(plan.tier === "plus" ? "plus" : "pro")}
      >
        {loadingTier === plan.tier ? "Opening checkout..." : `Upgrade to ${plan.name}`}
      </Button>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      <section className="flex flex-col items-center gap-4 text-center">
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">Pick the plan that fits how you bet</h1>
        <p className="max-w-xl text-muted-foreground sm:text-lg">
          Start free. Upgrade for live bets and alerts, or go Pro for the full AI model and every tool. Cancel any time.
        </p>
        <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5 text-sm" role="group" aria-label="Billing period">
          {(["month", "year"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={interval === option}
              onClick={() => setInterval(option)}
              className={
                interval === option
                  ? "rounded-full bg-foreground px-4 py-1.5 font-medium text-background"
                  : "rounded-full px-4 py-1.5 text-muted-foreground hover:text-foreground"
              }
            >
              {option === "year" ? "Annual, 2 months free" : "Monthly"}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Plans" className="space-y-3">
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.tier} className={`gap-4 p-6 ${plan.tier === "pro" ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                {plan.tier === "pro" && <Badge>Most complete</Badge>}
                {plan.tier === "plus" && <Badge variant="outline">Popular</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              <p>
                <span className="text-4xl font-semibold">{interval === "year" ? plan.annual : plan.monthly}</span>
                <span className="text-muted-foreground">/mo</span>
                {interval === "year" && plan.tier !== "free" && <span className="ml-1.5 text-xs text-muted-foreground">billed annually</span>}
              </p>
              {planButton(plan)}
              <ul className="flex flex-col gap-2 text-sm">
                {plan.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-border/60 pt-3 text-xs text-muted-foreground">Best for: {plan.bestFor}</p>
            </Card>
          ))}
        </div>
        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
      </section>

      <section aria-labelledby="compare-heading" className="space-y-4">
        <div className="text-center">
          <h2 id="compare-heading" className="text-2xl font-semibold sm:text-3xl">Compare every feature</h2>
          <p className="mt-1 text-sm text-muted-foreground">Exactly what each plan includes.</p>
        </div>
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Feature comparison of the Free, Plus and Pro plans</caption>
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border/60">
                <th scope="col" className="px-4 py-3 font-medium">Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.tier} scope="col" className={`w-28 px-2 py-3 text-center font-semibold sm:w-36 ${plan.tier === "pro" ? "text-primary" : ""}`}>
                    {plan.name}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {(interval === "year" ? plan.annual : plan.monthly)}/mo
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => (
                <Fragment key={group.title}>
                  <tr className="bg-muted/30">
                    <th colSpan={4} scope="colgroup" className="px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-border/60">
                      <th scope="row" className="px-4 py-3 font-normal">
                        {row.label}
                        {row.help && <span className="mt-0.5 block text-xs text-muted-foreground">{row.help}</span>}
                      </th>
                      {row.values.map((value, index) => (
                        <td key={PLANS[index].tier} className="px-2 py-3 text-center">
                          <CellView value={value} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-3xl space-y-4">
        <h2 id="faq-heading" className="text-center text-2xl font-semibold sm:text-3xl">Questions</h2>
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          {FAQ.map((item) => (
            <details key={item.q} className="group px-4 py-3">
              <summary className="cursor-pointer list-none font-medium marker:hidden">{item.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-3 border-t border-border/60 pt-12 text-center">
        <h2 className="text-2xl font-semibold">Ready to find your first edge?</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Button nativeButton={false} render={<Link href={signedIn ? "/dashboard" : "/signup"} />}>
            {signedIn ? "Open dashboard" : "Start free"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>See live bets</Button>
        </div>
        <p className="max-w-xl text-xs text-muted-foreground">
          SharpLine provides data and analysis only and does not accept wagers. Betting involves risk and no result is guaranteed. 21+ only. If you or someone you know has a gambling problem, call 1-800-522-4700.
        </p>
      </section>
    </main>
  );
}
