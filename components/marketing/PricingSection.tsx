"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
}

const PRICING: PricingTier[] = [
  {
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
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
    name: "Plus",
    monthlyPrice: "$25",
    annualPrice: "$20.83",
    features: [
      "Live, real-time odds feed",
      "Unlimited +EV opportunities",
      "Real-time opportunity alerts (email)",
      "Moneyline, spread & total markets",
    ],
    cta: "Start Plus",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: "$49",
    annualPrice: "$40.83",
    features: [
      "Everything in Plus",
      "Line movement history",
      "Arbitrage, middles & same-game parlay EV",
      "Alerts for every opportunity type",
    ],
    cta: "Start Pro",
    href: "/signup",
    highlighted: true,
  },
];

export function PricingSection() {
  const [interval, setInterval] = useState<"month" | "year">("month");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5 text-xs">
        {(["month", "year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setInterval(option)}
            className={
              interval === option
                ? "rounded-full bg-foreground px-3 py-1.5 font-medium text-background"
                : "rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground"
            }
          >
            {option === "year" ? "Annual — 2 months free" : "Monthly"}
          </button>
        ))}
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-3">
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
              <span className="text-3xl font-semibold">
                {interval === "year" ? tier.annualPrice : tier.monthlyPrice}
              </span>
              <span className="text-muted-foreground">/mo</span>
              {interval === "year" && tier.name !== "Free" && (
                <span className="ml-1.5 text-xs text-muted-foreground">billed annually</span>
              )}
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
    </div>
  );
}
