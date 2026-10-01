"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@/lib/types";

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: "Free",
  plus: "Plus",
  pro: "Pro",
};

const TIER_DESCRIPTION: Record<SubscriptionTier, string> = {
  free: "15-minute delayed data, up to 3 +EV opportunities shown per day.",
  plus: "Real-time odds, unlimited +EV opportunities and alerts. No arbitrage, middles, or parlay EV.",
  pro: "Everything in Plus, plus arbitrage, middles, and same-game parlay EV.",
};

export function AccountView({
  email,
  tier,
}: {
  email: string;
  tier: SubscriptionTier;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");

  async function goToCheckout(targetTier: "plus" | "pro") {
    setIsLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: targetTier, interval }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      setIsLoading(false);
      return;
    }
    window.location.href = body.url;
  }

  async function goToPortal() {
    setIsLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      setIsLoading(false);
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-xl font-semibold">Account & Billing</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current plan</CardTitle>
          <Badge variant={tier === "free" ? "outline" : "default"}>{TIER_LABEL[tier]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{TIER_DESCRIPTION[tier]}</p>

          {tier !== "pro" && (
            <>
              <div className="inline-flex w-fit items-center rounded-full border border-border/60 bg-muted/30 p-0.5 text-xs">
                {(["month", "year"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setInterval(option)}
                    className={
                      interval === option
                        ? "rounded-full bg-foreground px-2.5 py-1 font-medium text-background"
                        : "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
                    }
                  >
                    {option === "year" ? "Annual (2 months free)" : "Monthly"}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {tier === "free" && (
                  <Button onClick={() => goToCheckout("plus")} disabled={isLoading} className="w-fit">
                    Upgrade to Plus
                  </Button>
                )}
                <Button
                  onClick={() => goToCheckout("pro")}
                  disabled={isLoading}
                  variant={tier === "free" ? "outline" : "default"}
                  className="w-fit"
                >
                  Upgrade to Pro
                </Button>
              </div>
            </>
          )}

          {tier !== "free" && (
            <Button variant="outline" onClick={goToPortal} disabled={isLoading} className="w-fit">
              Manage billing
            </Button>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {tier === "free"
              ? "Email alerts for your saved filters are available on Plus and Pro."
              : "Manage which saved filters trigger an email alert from the Dashboard's Alert settings panel."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
