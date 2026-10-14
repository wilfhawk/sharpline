"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTierPreview } from "@/hooks/useTierPreview";
import type { SubscriptionTier } from "@/lib/types";

const DEMO_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TIER_PREVIEW === "true";

const LEVELS: { tier: SubscriptionTier; label: string; hint: string }[] = [
  { tier: "free", label: "Free", hint: "Delayed, 3 picks a day" },
  { tier: "plus", label: "Plus", hint: "Live feed + model badge" },
  { tier: "pro", label: "Pro", hint: "Everything, incl. AI explanations" },
];

/** Test-only: lets visitors open the dashboard as any plan. Renders nothing unless NEXT_PUBLIC_ENABLE_TIER_PREVIEW=true. */
export function DemoLauncher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { setTierPreview } = useTierPreview();
  if (!DEMO_ENABLED) return null;

  function launch(tier: SubscriptionTier) {
    setTierPreview(tier);
    router.push("/dashboard");
  }

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 ${compact ? "p-4" : "p-5"}`}
      data-testid="demo-launcher"
    >
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Play className="size-4 text-primary" aria-hidden="true" /> Try the demo
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        Open the dashboard as any plan to test every feature. Nothing is charged. You can switch plans from the header.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {LEVELS.map(({ tier, label, hint }) => (
          <Button key={tier} variant={tier === "pro" ? "default" : "outline"} size="sm" title={hint} onClick={() => launch(tier)}>
            Demo as {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
