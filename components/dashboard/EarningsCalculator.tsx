"use client";

import { useState } from "react";
import Link from "next/link";
import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, RotateCcw, ShieldAlert } from "lucide-react";
import { earningsSchema, projectEarnings, type EarningsInputs } from "@/lib/earnings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const defaults: EarningsInputs = { bankroll: 2000, stakePercent: 1, betsPerMonth: 100, months: 6, decimalOdds: 1.91, edgePercent: 3, monthlyCost: 25 };
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const fields: { key: keyof EarningsInputs; label: string; min: number; max: number; step: number }[] = [
  { key: "bankroll", label: "Starting bankroll ($)", min: 100, max: 1_000_000, step: 100 },
  { key: "stakePercent", label: "Fixed stake (% of initial bankroll)", min: 0.1, max: 5, step: 0.1 },
  { key: "betsPerMonth", label: "Bets per month", min: 1, max: 1000, step: 1 },
  { key: "months", label: "Months", min: 1, max: 12, step: 1 },
  { key: "decimalOdds", label: "Average decimal odds", min: 1.01, max: 20, step: 0.01 },
  { key: "edgePercent", label: "Assumed true edge (%)", min: -20, max: 20, step: 0.5 },
  { key: "monthlyCost", label: "Monthly subscriptions and costs ($)", min: 0, max: 10_000, step: 1 },
];

export function EarningsCalculator() {
  const [input, setInput] = useState(defaults);
  const parsed = earningsSchema.safeParse(input);
  const result = parsed.success ? projectEarnings(parsed.data) : null;
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground"><Calculator className="size-4" /> SharpLine Academy</p><h1 className="text-2xl font-semibold">Earnings & Risk</h1><p className="mt-2 text-sm text-muted-foreground">Hypothetical returns, after costs. Not an income forecast.</p></div><Link href="/learn" className="text-sm underline">Back to Learn</Link></div>
    <div className="grid gap-8 border-y border-border py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <div className="flex items-center justify-between"><h2 className="font-medium">Assumptions</h2><Button type="button" size="icon" variant="ghost" aria-label="Reset assumptions" title="Reset assumptions" onClick={() => setInput(defaults)}><RotateCcw className="size-4" /></Button></div>
        {fields.map((field) => <label key={field.key} className="block space-y-1.5 text-sm"><span>{field.label}</span><Input type="number" min={field.min} max={field.max} step={field.step} value={input[field.key]} onChange={(event) => setInput({ ...input, [field.key]: Number(event.target.value) })} /></label>)}
      </form>
      <div className="min-w-0 space-y-6" aria-live="polite">
        {!result ? <p role="alert" className="text-destructive">{parsed.error?.issues[0]?.message ?? "Check your assumptions."}</p> : <>
          <dl className="grid grid-cols-2 gap-5 border-b border-border pb-5 sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Expected net profit</dt><dd className={`mt-1 text-2xl font-semibold tabular-nums ${result.final.expected >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>{money(result.final.expected)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Chance of a net loss</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-300">{(result.final.lossProbability * 100).toFixed(1)}%</dd></div>
            <div><dt className="text-xs text-muted-foreground">Fixed stake per bet</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{money(result.stake)}</dd></div>
          </dl>
          <div><h2 className="font-medium">Net outcome range</h2><p className="mt-1 text-xs text-muted-foreground">Modeled central 95% range, with expected net profit in green.</p></div>
          <div className="h-72 w-full min-w-0" role="img" aria-label={`Expected net profit ${money(result.final.expected)}; modeled range ${money(result.final.lower)} to ${money(result.final.upper)}`}>
            <ResponsiveContainer width="100%" height="100%"><ComposedChart data={result.timeline} margin={{ top: 10, right: 12, bottom: 0, left: 8 }}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} label={{ value: "Month", position: "insideBottomRight", offset: -2 }} />
              <YAxis width={65} tick={{ fontSize: 11 }} tickFormatter={(value) => money(Number(value))} tickLine={false} />
              <Tooltip formatter={(value) => Array.isArray(value) ? value.map((item) => money(Number(item))).join(" to ") : money(Number(value))} labelFormatter={(value) => `Month ${value}`} contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <ReferenceLine y={0} stroke="#a1a1aa" strokeDasharray="4 4" />
              <Area dataKey="range" name="95% modeled range" stroke="#d97706" fill="#d97706" fillOpacity={0.12} />
              <Line dataKey="expected" name="Expected net profit" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart></ResponsiveContainer>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm tabular-nums"><thead><tr className="border-b"><th className="py-2">Month</th><th className="text-right">Lower 2.5%</th><th className="text-right">Expected</th><th className="text-right">Upper 97.5%</th></tr></thead><tbody>{result.timeline.map((row) => <tr key={row.month} className="border-b border-border/40"><td className="py-2">{row.month}</td><td className="text-right text-muted-foreground">{money(row.lower)}</td><td className="text-right">{money(row.expected)}</td><td className="text-right text-muted-foreground">{money(row.upper)}</td></tr>)}</tbody></table></div>
          <p className="text-xs text-muted-foreground">{result.final.bets.toLocaleString()} bets / {money(result.turnover)} total staked / {money(result.final.costs)} costs. Assumed win probability: {(result.winProbability * 100).toFixed(2)}%.</p>
        </>}
      </div>
    </div>
    <section className="max-w-4xl space-y-3 text-sm text-muted-foreground"><h2 className="flex items-center gap-2 font-medium text-foreground"><ShieldAlert className="size-4 text-amber-500" /> Model limits</h2><p>Assumes independent bets with identical odds and a known, constant true edge. Uses a binomial win distribution and a fixed dollar stake, without compounding. The 95% range is conditional on those assumptions, not a guarantee or an estimate of model accuracy.</p><p>Assumes sufficient funds to place every bet. It does not simulate bankroll depletion, correlated results, pushes, taxes, bookmaker limits, voids, or changing prices. Losses can exceed the starting bankroll in this mathematical model; in practice, stop before exhausting money you can afford to lose. A displayed +EV estimate is not proof of a true edge.</p><Link href="/responsible-gambling" className="inline-block underline">Responsible gambling resources</Link></section>
  </main>;
}