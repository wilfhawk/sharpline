import { TrendingUp } from "lucide-react";

export function Logo() {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold tracking-wide">
      <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <TrendingUp className="size-3.5" />
      </span>
      SharpLine
    </span>
  );
}
