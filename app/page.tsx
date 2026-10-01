import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/Logo";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { RoiCalculator } from "@/components/marketing/RoiCalculator";
import {
  ArrowRight,
  Check,
  Clock,
  LineChart,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const PREVIEW_ROWS = [
  { event: "Chiefs @ Bills", side: "Chiefs ML", book: "Caesars", odds: "+130", fair: "+122", ev: "+3.8%" },
  { event: "Lakers @ Warriors", side: "Warriors ML", book: "FanDuel", odds: "+160", fair: "+153", ev: "+3.0%" },
  { event: "Celtics @ Bucks", side: "Celtics ML", book: "Caesars", odds: "+170", fair: "+162", ev: "+2.9%" },
];

const FEATURES = [
  {
    icon: Radar,
    title: "Every book, one feed",
    description:
      "DraftKings, FanDuel, BetMGM, Caesars and more, polled continuously and normalized into a single live table.",
  },
  {
    icon: LineChart,
    title: "De-vigged Pinnacle benchmark",
    description:
      "We strip Pinnacle's vig with the multiplicative or power method to get a true, sharp-market probability for every line.",
  },
  {
    icon: TrendingUp,
    title: "Ranked by real edge",
    description:
      "Every price is scored against fair odds and sorted by EV%, so the best opportunities always float to the top.",
  },
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
      "Arbitrage, middles & same-game parlay EV",
      "Real-time opportunity alerts",
    ],
    cta: "Start Pro",
    href: "/signup",
    highlighted: true,
  },
];

const RISK_REVERSAL = [
  { icon: Clock, text: "Cancel anytime, no lock-in contract" },
  { icon: Sparkles, text: "Free tier forever — no card required to start" },
  { icon: ShieldCheck, text: "Data & analysis only — we never touch your funds" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/learn"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Learn
            </Link>
            <Link
              href="/login"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Log in
            </Link>
            <Button size="sm" nativeButton={false} render={<Link href="/signup" />}>
              Sign up
            </Button>
          </nav>
        </div>
      </header>

      <section className="bg-grid bg-glow relative overflow-hidden border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            De-vigged Pinnacle fair odds, live
          </span>
          <h1 className="max-w-2xl text-3xl leading-[1.15] font-semibold tracking-tight sm:text-6xl">
            Find <span className="text-primary">+EV</span> betting
            opportunities before the market catches up.
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
            SharpLine compares U.S. sportsbook odds against a de-vigged
            Pinnacle benchmark in real time, surfacing statistical edges the
            moment they appear — dense, fast, and built for serious bettors.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/signup" />}
              className="gap-1.5"
            >
              Start free
              <ArrowRight className="size-4" />
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
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="gap-3 p-6">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span className="text-sm font-medium">Live opportunities</span>
            <Badge variant="outline" className="gap-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Live
            </Badge>
          </div>
          <div className="divide-y divide-border/60">
            {PREVIEW_ROWS.map((row) => (
              <div
                key={row.event}
                className="flex flex-col gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
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

      <section className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 pb-16 text-sm text-muted-foreground sm:px-6">
        {RISK_REVERSAL.map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            {text}
          </span>
        ))}
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-16 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            How SharpLine compares
          </h2>
          <p className="text-sm text-muted-foreground">
            Most +EV tools stop at one sharp reference book. SharpLine goes further.
          </p>
        </div>
        <ComparisonTable />
      </section>

      <section className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            What could your edge be worth?
          </h2>
          <p className="text-sm text-muted-foreground">
            Plug in your numbers to see a simplified projection.
          </p>
        </div>
        <RoiCalculator />
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Pricing</h2>
          <p className="text-sm text-muted-foreground">
            Start free. Upgrade when you want the full live feed.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRICING.map((tier) => (
            <Card
              key={tier.name}
              className={`gap-4 p-6 ${tier.highlighted ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                {tier.highlighted && <Badge>Most popular</Badge>}
              </div>
              <p>
                <span className="text-3xl font-semibold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="size-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-2 w-full"
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

      <section className="border-t border-border/60 bg-muted/10">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <ShieldCheck className="size-8 text-primary" />
          <h2 className="text-2xl font-semibold">
            Data and analysis only — you place the bets, on your terms.
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            SharpLine never holds funds or facilitates wagering. See our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/responsible-gambling"
              className="underline hover:text-foreground"
            >
              Responsible Gambling
            </Link>{" "}
            resources.
          </p>
          <Button nativeButton={false} render={<Link href="/signup" />}>
            Get started free
          </Button>
        </div>
      </section>
    </div>
  );
}
