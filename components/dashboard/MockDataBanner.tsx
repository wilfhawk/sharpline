import { Info } from "lucide-react";

export function MockDataBanner() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
      <Info className="size-4 shrink-0" />
      <p>
        Showing <span className="font-medium">sample data</span> — no live
        odds provider is configured yet. Connect a real feed in{" "}
        <code className="rounded bg-black/20 px-1 py-0.5 text-xs">
          lib/odds-provider.ts
        </code>{" "}
        to go live.
      </p>
    </div>
  );
}
