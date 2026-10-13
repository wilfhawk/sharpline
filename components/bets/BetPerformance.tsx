"use client";

import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { summarizeBets, type PerformanceBet } from "@/lib/performance";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const signed = (value: number, suffix = "") => `${value >= 0 ? "+" : ""}${value.toFixed(1)}${suffix}`;
const tone = (value: number) => (value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500");

export function BetPerformance({ bets }: { bets: PerformanceBet[] }) {
  const summary = summarizeBets(bets);
  if (summary.settledCount === 0) {
    return (
      <p className="rounded-lg border border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
        Mark a bet as Won, Lost, or Push below to see your profit, ROI, and results against expected value.
      </p>
    );
  }
  const luck = summary.netProfit - summary.expectedProfit;
  return (
    <section aria-label="Betting performance" className="space-y-4">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div><dt className="text-xs text-muted-foreground">Net profit</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${tone(summary.netProfit)}`}>{money(summary.netProfit)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">ROI</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${summary.roiPercent === null ? "" : tone(summary.roiPercent)}`}>{summary.roiPercent === null ? "-" : signed(summary.roiPercent, "%")}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Expected profit (EV)</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{money(summary.expectedProfit)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Avg CLV</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${summary.averageClvPercent === null ? "" : tone(summary.averageClvPercent)}`}>{summary.averageClvPercent === null ? "-" : signed(summary.averageClvPercent, "%")}</dd></div>
      </dl>
      <p className="text-xs text-muted-foreground">
        {summary.settledCount} settled, {summary.openCount} open
        {summary.winRatePercent !== null && <> / win rate {summary.winRatePercent.toFixed(0)}%</>}
        {" / "}{luck >= 0 ? "running above" : "running below"} expectation by {money(Math.abs(luck))}. Small samples are mostly variance.
      </p>
      <div className="h-56 w-full min-w-0" role="img" aria-label={`Net profit ${money(summary.netProfit)} versus expected ${money(summary.expectedProfit)} over ${summary.settledCount} settled bets`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={summary.equity} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <XAxis dataKey="index" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis width={60} tick={{ fontSize: 11 }} tickFormatter={(value) => money(Number(value))} tickLine={false} />
            <Tooltip formatter={(value) => money(Number(value))} labelFormatter={(value) => `Bet ${value}`} contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 6 }} />
            <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="4 4" />
            <Area dataKey="expected" name="Expected profit" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.1} strokeDasharray="4 4" />
            <Line dataKey="actual" name="Actual profit" stroke="#10b981" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
