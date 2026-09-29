import { Landmark, Sparkles, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { EvOpportunity } from "@/lib/types";

interface StatsRowProps {
  opportunities: EvOpportunity[];
  sportsbookCount: number;
}

function formatEv(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function StatsRow({ opportunities, sportsbookCount }: StatsRowProps) {
  const count = opportunities.length;
  const avgEv = count > 0
    ? opportunities.reduce((sum, o) => sum + o.evPercent, 0) / count
    : 0;
  const bestEv = count > 0 ? Math.max(...opportunities.map((o) => o.evPercent)) : 0;

  const stats = [
    { icon: Target, label: "Opportunities", value: String(count) },
    { icon: TrendingUp, label: "Average EV", value: formatEv(avgEv) },
    { icon: Sparkles, label: "Best EV", value: formatEv(bestEv) },
    { icon: Landmark, label: "Sportsbooks tracked", value: String(sportsbookCount) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ icon: Icon, label, value }) => (
        <Card key={label} size="sm" className="gap-1 p-4">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          <p className="text-lg font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </Card>
      ))}
    </div>
  );
}
