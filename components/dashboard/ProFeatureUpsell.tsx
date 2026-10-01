import Link from "next/link";
import { Lock } from "lucide-react";

export function ProFeatureUpsell({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 px-4 py-10 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{feature}</span> is a Pro
        feature.
      </p>
      <Link
        href="/account"
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
