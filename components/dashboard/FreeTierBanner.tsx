import { Lock } from "lucide-react";

export function FreeTierBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-200">
      <Lock className="size-4 shrink-0" />
      <p>
        Viewing the <span className="font-medium">free tier</span> — odds are
        15 minutes delayed and capped at 3 opportunities/day.{" "}
        <a href="/account" className="font-medium underline underline-offset-2">
          Upgrade to Pro
        </a>{" "}
        for live, unlimited opportunities.
      </p>
    </div>
  );
}
