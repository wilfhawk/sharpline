"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubscriptionTier } from "@/lib/types";

export function AccountView({
  email,
  tier,
}: {
  email: string;
  tier: SubscriptionTier;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goToCheckout() {
    setIsLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
          <Badge variant={tier === "pro" ? "default" : "outline"}>
            {tier === "pro" ? "Pro" : "Free"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tier === "free" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Free plan: 15-minute delayed data, up to 3 +EV opportunities
                shown per day.
              </p>
              <Button onClick={goToCheckout} disabled={isLoading} className="w-fit">
                Upgrade to Pro
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Pro plan: full live feed, unlimited +EV opportunities.
              </p>
              <Button
                variant="outline"
                onClick={goToPortal}
                disabled={isLoading}
                className="w-fit"
              >
                Manage billing
              </Button>
            </>
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
            Email/SMS alerts for new +EV opportunities are coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
