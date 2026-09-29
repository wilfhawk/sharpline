import { decimalToAmerican } from "./odds-utils";

/** e.g. 2.5 -> "+150", 1.5 -> "-200" */
export function formatAmericanOdds(oddsDecimal: number): string {
  const american = Math.round(decimalToAmerican(oddsDecimal));
  return american > 0 ? `+${american}` : `${american}`;
}

/** e.g. 5.234 -> "+5.2%" */
export function formatEvPercent(evPercent: number): string {
  const rounded = evPercent.toFixed(1);
  return evPercent > 0 ? `+${rounded}%` : `${rounded}%`;
}

/** Tailwind text/background classes: green shades scale with EV strength, red/gray otherwise. */
export function evColorClasses(evPercent: number, minThresholdPercent = 2): string {
  if (evPercent >= minThresholdPercent * 2.5) {
    return "text-emerald-400 bg-emerald-500/10";
  }
  if (evPercent >= minThresholdPercent) {
    return "text-emerald-500 bg-emerald-500/5";
  }
  if (evPercent >= 0) {
    return "text-muted-foreground bg-transparent";
  }
  return "text-red-400/80 bg-red-500/5";
}

/** e.g. "in 3h 15m", "in 12m", "LIVE" for events that have already started. */
export function formatTimeToStart(startTimeIso: string, nowMs = Date.now()): string {
  const diffMs = new Date(startTimeIso).getTime() - nowMs;
  if (diffMs <= 0) return "LIVE";

  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `in ${minutes}m`;
  if (minutes === 0) return `in ${hours}h`;
  return `in ${hours}h ${minutes}m`;
}
