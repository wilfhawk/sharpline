import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Small inline "?" icon that shows a plain-language definition on hover — use next to jargon-y labels. */
export function InfoTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex text-muted-foreground hover:text-foreground"
        aria-label="What does this mean?"
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
