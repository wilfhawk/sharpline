"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { americanToDecimal } from "@/lib/odds-utils";
import {
  convertBonusBet,
  depositMatchSchema,
  evaluateDepositMatch,
  evaluateProfitBoost,
  evaluateRiskFree,
  type DepositMatchInput,
} from "@/lib/promos";
import { Input } from "@/components/ui/input";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const TABS = [
  { id: "bonus", label: "Bonus bet" },
  { id: "boost", label: "Profit boost" },
  { id: "risk", label: "Risk-free bet" },
  { id: "match", label: "Deposit match" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Field({ label, value, onChange, step = "any", min, odds = false }: { label: string; value: string; onChange: (value: string) => void; step?: string; min?: number; odds?: boolean }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span>{label}</span>
      {/* American odds need a leading + or -, which type="number" rejects. */}
      {odds ? <Input type="text" inputMode="text" autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} /> : <Input type="number" inputMode="decimal" step={step} min={min} value={value} onChange={(event) => onChange(event.target.value)} />}
    </label>
  );
}

function Result({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "bad" ? "text-rose-500" : "";
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</dd></div>;
}

/** American odds text -> decimal, or null while the input is missing or invalid. */
function toDecimal(text: string): number | null {
  const american = Number(text);
  if (text.trim() === "" || !Number.isFinite(american) || (american > -100 && american < 100)) return null;
  return americanToDecimal(american);
}

const num = (text: string): number | null => (text.trim() === "" || !Number.isFinite(Number(text)) ? null : Number(text));
const tone = (value: number) => (value >= 0 ? "good" : "bad") as "good" | "bad";
const Prompt = () => <p className="text-sm text-muted-foreground">Enter valid values to see the result. American odds must be -100 or lower, or +100 or higher.</p>;

export function PromoCalculator() {
  const [tab, setTab] = useState<TabId>("bonus");
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Promo type" className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${tab === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="grid gap-8 border-y border-border py-6 md:grid-cols-[280px_minmax(0,1fr)]">
        {tab === "bonus" && <BonusBet />}
        {tab === "boost" && <ProfitBoost />}
        {tab === "risk" && <RiskFree />}
        {tab === "match" && <DepositMatch />}
      </div>
      <section className="max-w-3xl space-y-2 text-sm text-muted-foreground">
        <h2 className="flex items-center gap-2 font-medium text-foreground"><ShieldAlert className="size-4 text-amber-500" /> Before you rely on these numbers</h2>
        <p>Results assume the second book accepts the full hedge at the odds you enter, with no limits, voids, or price moves. Check each promo&apos;s terms for minimum odds, eligible markets, and whether the stake is returned. Bonus bets usually pay winnings only. Promotions vary by state and change often.</p>
        <p>Track what you have open on <Link href="/books" className="underline">My Books</Link>. <Link href="/responsible-gambling" className="underline">Responsible gambling resources</Link>.</p>
      </section>
    </div>
  );
}

function BonusBet() {
  const [bonus, setBonus] = useState("100");
  const [bonusOdds, setBonusOdds] = useState("+300");
  const [hedgeOdds, setHedgeOdds] = useState("-350");
  const amount = num(bonus);
  const o1 = toDecimal(bonusOdds);
  const o2 = toDecimal(hedgeOdds);
  const result = amount && amount > 0 && o1 && o2 ? convertBonusBet({ bonus: amount, bonusOdds: o1, hedgeOdds: o2 }) : null;
  return (
    <>
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Bonus bet amount ($)" value={bonus} onChange={setBonus} min={1} />
        <Field label="Bonus bet odds (American)" value={bonusOdds} odds onChange={setBonusOdds} />
        <Field label="Hedge odds on the other side (American)" value={hedgeOdds} odds onChange={setHedgeOdds} />
        <p className="text-xs text-muted-foreground">Longshot odds on the bonus bet and a tight hedge at another book convert best. Look for +200 to +400.</p>
      </form>
      <dl className="grid h-fit grid-cols-2 gap-5 sm:grid-cols-3" aria-live="polite">
        {result ? <>
          <Result label="Hedge stake" value={money(result.hedgeStake)} />
          <Result label="Guaranteed profit" value={money(result.profit)} tone="good" />
          <Result label="Conversion rate" value={`${result.conversionPercent.toFixed(1)}%`} />
        </> : <Prompt />}
      </dl>
    </>
  );
}

function ProfitBoost() {
  const [stake, setStake] = useState("50");
  const [odds, setOdds] = useState("+200");
  const [boost, setBoost] = useState("30");
  const [fair, setFair] = useState("");
  const [hedge, setHedge] = useState("");
  const s = num(stake);
  const o = toDecimal(odds);
  const b = num(boost);
  const fairOdds = toDecimal(fair);
  const hedgeDecimal = toDecimal(hedge);
  const valid = s && s > 0 && o && b !== null && b >= 0 && b <= 500;
  const fairProbability = fairOdds ? 1 / fairOdds : null;
  const result = valid && fairProbability !== null ? evaluateProfitBoost({ stake: s, odds: o, boostPercent: b, fairProbability, hedgeOdds: hedgeDecimal }) : null;
  return (
    <>
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Stake ($)" value={stake} onChange={setStake} min={1} />
        <Field label="Original odds (American)" value={odds} odds onChange={setOdds} />
        <Field label="Boost (% extra profit)" value={boost} onChange={setBoost} min={0} />
        <Field label="Fair odds, no vig (American)" value={fair} odds onChange={setFair} />
        <Field label="Hedge odds, optional (American)" value={hedge} odds onChange={setHedge} />
        <p className="text-xs text-muted-foreground">Use a sharp book&apos;s de-vigged price for fair odds. Leave the hedge blank to see long-run EV only.</p>
      </form>
      <dl className="grid h-fit grid-cols-2 gap-5 sm:grid-cols-3" aria-live="polite">
        {result ? <>
          <Result label="Boosted odds" value={`${result.boostedOdds.toFixed(2)}x`} />
          <Result label="Expected value" value={money(result.evDollars)} tone={tone(result.evDollars)} />
          <Result label="EV %" value={`${result.evPercent.toFixed(1)}%`} tone={tone(result.evPercent)} />
          {result.hedgeStake !== null && result.lockedProfit !== null && <>
            <Result label="Hedge stake" value={money(result.hedgeStake)} />
            <Result label="Locked-in result" value={money(result.lockedProfit)} tone={tone(result.lockedProfit)} />
          </>}
        </> : <p className="text-sm text-muted-foreground">Enter your stake, odds, boost, and the fair odds to see the value.</p>}
      </dl>
    </>
  );
}

function RiskFree() {
  const [stake, setStake] = useState("500");
  const [odds, setOdds] = useState("+200");
  const [hedge, setHedge] = useState("-220");
  const [cap, setCap] = useState("500");
  const [rate, setRate] = useState("70");
  const s = num(stake);
  const o1 = toDecimal(odds);
  const o2 = toDecimal(hedge);
  const c = num(cap);
  const r = num(rate);
  const result = s && s > 0 && o1 && o2 && c && c > 0 && r !== null && r >= 0 && r <= 100 ? evaluateRiskFree({ stake: s, odds: o1, hedgeOdds: o2, refundCap: c, conversionRate: r / 100 }) : null;
  return (
    <>
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Risk-free stake ($)" value={stake} onChange={setStake} min={1} />
        <Field label="Odds on that bet (American)" value={odds} odds onChange={setOdds} />
        <Field label="Hedge odds at another book (American)" value={hedge} odds onChange={setHedge} />
        <Field label="Maximum refund ($)" value={cap} onChange={setCap} min={1} />
        <Field label="Bonus bet conversion rate (%)" value={rate} onChange={setRate} min={0} />
        <p className="text-xs text-muted-foreground">The refund is paid as a bonus bet, so it is worth only the share you can convert. 60-75% is typical.</p>
      </form>
      <dl className="grid h-fit grid-cols-2 gap-5 sm:grid-cols-3" aria-live="polite">
        {result ? <>
          <Result label="Hedge stake" value={money(result.hedgeStake)} />
          <Result label="Refund if it loses" value={money(result.refund)} />
          <Result label="Profit either way" value={money(result.profit)} tone={tone(result.profit)} />
        </> : <Prompt />}
      </dl>
    </>
  );
}

function DepositMatch() {
  const [form, setForm] = useState({ deposit: "500", matchPercent: "100", maxBonus: "500", playthrough: "10", holdPercent: "4.5" });
  const [basis, setBasis] = useState<DepositMatchInput["basis"]>("deposit_plus_bonus");
  const parsed = depositMatchSchema.safeParse({
    deposit: num(form.deposit),
    matchPercent: num(form.matchPercent),
    maxBonus: num(form.maxBonus),
    playthrough: num(form.playthrough),
    holdPercent: num(form.holdPercent),
    basis,
  });
  const result = parsed.success ? evaluateDepositMatch(parsed.data) : null;
  const set = (key: keyof typeof form) => (value: string) => setForm({ ...form, [key]: value });
  return (
    <>
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}>
        <Field label="Deposit ($)" value={form.deposit} onChange={set("deposit")} min={1} />
        <Field label="Match (%)" value={form.matchPercent} onChange={set("matchPercent")} min={0} />
        <Field label="Maximum bonus ($)" value={form.maxBonus} onChange={set("maxBonus")} min={1} />
        <Field label="Playthrough (x)" value={form.playthrough} onChange={set("playthrough")} min={0} />
        <label className="block space-y-1.5 text-sm"><span>Playthrough applies to</span>
          <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={basis} onChange={(event) => setBasis(event.target.value as DepositMatchInput["basis"])}>
            <option value="deposit_plus_bonus">Deposit plus bonus</option>
            <option value="bonus">Bonus only</option>
          </select>
        </label>
        <Field label="House edge on your bets (%)" value={form.holdPercent} onChange={set("holdPercent")} min={0} />
        <p className="text-xs text-muted-foreground">Betting +EV lines or low-vig markets lowers the house edge you pay while clearing the playthrough.</p>
      </form>
      <dl className="grid h-fit grid-cols-2 gap-5 sm:grid-cols-3" aria-live="polite">
        {result ? <>
          <Result label="Bonus" value={money(result.bonus)} />
          <Result label="Wagering required" value={money(result.wageringRequired)} />
          <Result label="Expected cost" value={money(result.expectedCost)} tone="bad" />
          <Result label="Expected value" value={money(result.expectedValue)} tone={tone(result.expectedValue)} />
        </> : <Prompt />}
      </dl>
    </>
  );
}
