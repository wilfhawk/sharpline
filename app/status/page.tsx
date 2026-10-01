"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface HealthResponse {
  ok: boolean;
  errorMessage: string | null;
  providerName: string;
  isMock: boolean;
  eventCount: number;
  fetchDurationMs: number;
  checkedAt: string;
  pollIntervalSeconds: number;
  livePollIntervalSeconds: number;
  oddsApiCacheSeconds: number;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function check() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setHealth(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">System Status</h1>
          <p className="text-sm text-muted-foreground">
            Live odds data source health and polling configuration.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={check} disabled={isLoading} className="gap-1.5">
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="gap-4 p-5">
        {health ? (
          <>
            <div className="flex items-center gap-2">
              {health.ok ? (
                <CheckCircle2 className="size-5 text-emerald-400" />
              ) : (
                <XCircle className="size-5 text-red-400" />
              )}
              <span className="font-medium">
                {health.ok ? "Odds data source: operational" : "Odds data source: degraded"}
              </span>
            </div>
            {health.errorMessage && (
              <p className="text-sm text-red-300">{health.errorMessage}</p>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="text-right">
                {health.providerName}
                {health.isMock ? " (sample data)" : ""}
              </dd>

              <dt className="text-muted-foreground">Events tracked</dt>
              <dd className="text-right tabular-nums">{health.eventCount}</dd>

              <dt className="text-muted-foreground">Last checked</dt>
              <dd className="text-right tabular-nums">
                {new Date(health.checkedAt).toLocaleString()}
              </dd>

              <dt className="text-muted-foreground">Check duration</dt>
              <dd className="text-right tabular-nums">{health.fetchDurationMs}ms</dd>

              <dt className="text-muted-foreground">Dashboard poll interval</dt>
              <dd className="text-right tabular-nums">
                {health.pollIntervalSeconds}s ({health.livePollIntervalSeconds}s during live games)
              </dd>

              <dt className="text-muted-foreground">Upstream odds cache</dt>
              <dd className="text-right tabular-nums">{health.oddsApiCacheSeconds}s</dd>
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Checking…</p>
        )}
      </Card>

      <p className="text-xs text-muted-foreground">
        This is a v1 status page reporting the odds data source's health at
        the moment you load this page — it does not yet track historical
        uptime or send outage notifications.
      </p>
    </div>
  );
}
