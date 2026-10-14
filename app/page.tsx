import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/layout/Logo";
import { LiveProof } from "@/components/marketing/LiveProof";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { RoiCalculator } from "@/components/marketing/RoiCalculator";
import { PricingSection } from "@/components/marketing/PricingSection";
import { DemoLauncher } from "@/components/marketing/DemoLauncher";
import {
  ArrowRight,
  Clock,
  Gift,
  LineChart,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: Radar,
    title: "Every book, one feed",
    description:
      "DraftKings, FanDuel, BetMGM, Caesars and more, polled continuously and normalized into a single live table.",
  },
  {
    icon: LineChart,
    title: "A true-odds benchmark",
    description:
      "Pinnacle is the bookmaker sharp bettors trust most. We take its odds, remove its built-in fee, and treat the result as the true chance of each outcome.",
  },
  {
    icon: TrendingUp,
    title: "Ranked by real edge",
    description:
      "Every price is compared with the true odds and sorted by edge, so the bets paying the most above fair value float to the top.",
  },
  {
    icon: Gift,
    title: "Promo converter",
    description:
      "Turn bonus bets, profit boosts, risk-free bets, and deposit matches into hedged profit, or see when a promo isn't worth it.",
  },
  {
    icon: Wallet,
    title: "Books, limits, and promos",
    description:
      "Track balances, bet limits, and expiring promos per sportsbook. Suggested stakes respect each book's limit.",
  },
  {
    icon: Radar,
    title: "Player props and all games",
    description:
      "Browse every game and compare prices whether or not there is an edge, with player props scored against the market consensus.",
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
              href="/pricing"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/learn"
              className="hidden text-muted-foreground hover:text-foreground sm:inline"
            >
              Learn
            </Link>
            <Button size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
              View dashboard
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
            Spot bets that pay more than they should
          </span>
          <h1 className="max-w-2xl text-3xl leading-[1.15] font-semibold tracking-tight sm:text-6xl">
            Find <span className="text-primary">+EV</span> betting
            opportunities before the market catches up.
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground sm:text-lg">
            SharpLine checks every U.S. sportsbook&apos;s odds against the
            true odds set by the sharpest bookmaker, and shows you which bet
            to make, where, and how big the edge is. Simple, fast, and no
            math required.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/dashboard" />}
              className="gap-1.5"
            >
              View live dashboard
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/learn" />}
            >
              How it works
            </Button>
          </div>
          <DemoLauncher />
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

      <LiveProof />

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
        <PricingSection />
        <p className="mt-4 text-center text-sm">
          <Link href="/pricing" className="text-primary underline">Compare every feature across plans</Link>
        </p>
        <div className="mt-8">
          <DemoLauncher compact />
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
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Open dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
