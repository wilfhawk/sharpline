"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * Illustrative-only projection: bankroll growing by (edge% * bets/week * avg
 * stake) compounded weekly. This is a simplified model for demonstration, not
 * a prediction — real returns depend on variance, bet availability, and
 * discipline, and are never guaranteed.
 */
function projectMonthlyReturn(
  bankroll: number,
  avgEdgePercent: number,
  betsPerWeek: number,
  avgStakePercent: number
): { week: number; balance: number }[] {
  const weeklyEdgeFraction = (avgEdgePercent / 100) * (avgStakePercent / 100) * betsPerWeek;
  const weeks: { week: number; balance: number }[] = [{ week: 0, balance: bankroll }];
  let balance = bankroll;
  for (let week = 1; week <= 4; week++) {
    balance = balance * (1 + weeklyEdgeFraction);
    weeks.push({ week, balance });
  }
  return weeks;
}

export function RoiCalculator() {
  const [bankroll, setBankroll] = useState(1000);
  const [avgEdgePercent, setAvgEdgePercent] = useState(3.5);
  const [betsPerWeek, setBetsPerWeek] = useState(10);
  const [avgStakePercent, setAvgStakePercent] = useState(2);

  const projection = useMemo(
    () => projectMonthlyReturn(bankroll, avgEdgePercent, betsPerWeek, avgStakePercent),
    [bankroll, avgEdgePercent, betsPerWeek, avgStakePercent]
  );

  const monthEnd = projection[projection.length - 1].balance;
  const projectedGain = monthEnd - bankroll;

  return (
    <Card className="gap-5 p-6">
      <div>
        <h3 className="font-medium">Estimate your edge</h3>
        <p className="text-sm text-muted-foreground">
          A simplified projection based on your bankroll and betting cadence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roi-bankroll">Bankroll</Label>
          <Input
            id="roi-bankroll"
            type="number"
            min={0}
            value={bankroll}
            onChange={(e) => setBankroll(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roi-edge">Average edge per bet (%)</Label>
          <Input
            id="roi-edge"
            type="number"
            step="0.1"
            min={0}
            value={avgEdgePercent}
            onChange={(e) => setAvgEdgePercent(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roi-frequency">Bets per week</Label>
          <Input
            id="roi-frequency"
            type="number"
            min={0}
            value={betsPerWeek}
            onChange={(e) => setBetsPerWeek(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roi-stake">Average stake (% of bankroll)</Label>
          <Input
            id="roi-stake"
            type="number"
            step="0.1"
            min={0}
            value={avgStakePercent}
            onChange={(e) => setAvgStakePercent(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">Projected balance after 4 weeks</p>
        <p className="text-2xl font-semibold tabular-nums">
          {formatUsd(monthEnd)}{" "}
          <span
            className={`text-sm font-medium ${projectedGain >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            ({projectedGain >= 0 ? "+" : ""}
            {formatUsd(projectedGain)})
          </span>
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Hypothetical illustration only, assuming your stated edge holds and
        compounds evenly — not a prediction or guarantee of results. Betting
        involves variance and risk of loss; never stake more than you can
        afford to lose.
      </p>
    </Card>
  );
}
