import { Lock } from "lucide-react";

export function ProFeatureUpsell({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 px-4 py-10 text-center">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{feature}</span> is a Pro
        feature.
      </p>
      <p className="text-xs text-muted-foreground">
        Select Pro in the header to preview it.
      </p>
    </div>
  );
}
