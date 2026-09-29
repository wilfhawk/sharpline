import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PREVIEW_ROWS = [
  { event: "Chiefs @ Bills", side: "Chiefs ML", book: "Caesars", odds: "+130", fair: "+122", ev: "+3.8%" },
  { event: "Lakers @ Warriors", side: "Warriors ML", book: "FanDuel", odds: "+160", fair: "+153", ev: "+3.0%" },
  { event: "Celtics @ Bucks", side: "Celtics ML", book: "Caesars", odds: "+170", fair: "+162", ev: "+2.9%" },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: [
      "15-minute delayed odds data",
      "Up to 3 +EV opportunities per day",
      "Moneyline, spread & total markets",
    ],
    cta: "Get started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    features: [
      "Live, real-time odds feed",
      "Unlimited +EV opportunities",
      "Line movement history",
      "Alert settings (coming soon)",
    ],
    cta: "Start Pro",
    href: "/signup",
    highlighted: true,
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <span className="text-sm font-semibold tracking-wide">SharpLine</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
            Sign up
          </Button>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
        <Badge variant="outline">De-vigged Pinnacle fair odds, live</Badge>
        <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">
          Find +EV betting opportunities before the market catches up.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          SharpLine compares U.S. sportsbook odds against a de-vigged
          Pinnacle benchmark in real time, surfacing statistical edges the
          moment they appear — dense, fast, and built for serious bettors.
        </p>
        <div className="flex gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            Start free
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Log in
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-border/60">
            {PREVIEW_ROWS.map((row) => (
              <div
                key={row.event}
                className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.event}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.side} · {row.book}
                  </p>
                </div>
                <div className="flex items-center gap-4 tabular-nums text-muted-foreground">
                  <span>Odds {row.odds}</span>
                  <span>Fair {row.fair}</span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-400">
                    {row.ev}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sample preview — sign up to see your own live dashboard.
        </p>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
        <h2 className="mb-6 text-center text-2xl font-semibold">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRICING.map((tier) => (
            <Card
              key={tier.name}
              className={`p-6 ${tier.highlighted ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                {tier.highlighted && <Badge>Most popular</Badge>}
              </div>
              <p className="mt-2">
                <span className="text-3xl font-semibold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={tier.highlighted ? "default" : "outline"}
                nativeButton={false}
                render={<Link href={tier.href} />}
              >
                {tier.cta}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
