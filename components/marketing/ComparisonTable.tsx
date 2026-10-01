import { Card } from "@/components/ui/card";
import { Check, Minus } from "lucide-react";

interface ComparisonRow {
  label: string;
  sharpline: boolean;
  competitors: boolean;
}

const ROWS: ComparisonRow[] = [
  { label: "De-vigged Pinnacle fair-odds benchmark", sharpline: true, competitors: true },
  { label: "Multiple sharp references (Circa, BetOnline fallback)", sharpline: true, competitors: false },
  { label: "Cross-book arbitrage finder", sharpline: true, competitors: true },
  { label: "Middles finder", sharpline: true, competitors: false },
  { label: "Kelly Criterion stake sizing", sharpline: true, competitors: true },
  { label: "Closing Line Value (CLV) tracking", sharpline: true, competitors: true },
  { label: "Same-game parlay EV estimator", sharpline: true, competitors: false },
  { label: "Live / in-play EV detection", sharpline: true, competitors: true },
  { label: "Saved filters & watchlists", sharpline: true, competitors: true },
  { label: "Real-time opportunity alerts", sharpline: true, competitors: true },
];

function StatusIcon({ included }: { included: boolean }) {
  return included ? (
    <Check className="mx-auto size-4 text-emerald-400" />
  ) : (
    <Minus className="mx-auto size-4 text-muted-foreground/50" />
  );
}

export function ComparisonTable() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-border/60 px-4 py-3 text-sm font-medium">
        <span>Feature</span>
        <span className="w-20 text-center text-primary">SharpLine</span>
        <span className="w-20 text-center text-muted-foreground">Typical alternative</span>
      </div>
      <div className="divide-y divide-border/60">
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-2.5 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="w-20">
              <StatusIcon included={row.sharpline} />
            </span>
            <span className="w-20">
              <StatusIcon included={row.competitors} />
            </span>
          </div>
        ))}
      </div>
      <p className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        General feature comparison based on publicly available information as
        of publish time — competitor offerings change frequently, so verify
        current features directly with each provider.
      </p>
    </Card>
  );
}
