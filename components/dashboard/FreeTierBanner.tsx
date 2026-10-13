import { Lock } from "lucide-react";

export function FreeTierBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-200">
      <Lock className="size-4 shrink-0" />
      <p>
        Viewing the <span className="font-medium">free tier</span> — odds are
        at least 15 minutes delayed. The same three daily sample offers are
        shared across all filters. They are not current betting prices.
      </p>
    </div>
  );
}
