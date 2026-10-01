"use client";

import { useTierPreview } from "@/hooks/useTierPreview";

/** Public "preview as Free / Plus / Pro" segmented toggle — no login required, device-local only. */
export function TierToggle() {
  const { tierPreview, setTierPreview } = useTierPreview();
  const active = tierPreview ?? "free";

  return (
    <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/30 p-0.5 text-xs">
      {(["free", "plus", "pro"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setTierPreview(option)}
          className={
            active === option
              ? "rounded-full bg-foreground px-2.5 py-1 font-medium text-background"
              : "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground"
          }
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
