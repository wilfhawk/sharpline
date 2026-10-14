"use client";

import { useEffect, useState } from "react";
import { formatGameDateTime, formatGameStart } from "@/lib/display";
import type { EventStatus } from "@/lib/types";

/** Start date/time for later days, a live countdown on the day of the game, and a LIVE badge once started. */
export function GameStart({ status, startTime }: { status: EventStatus; startTime: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (status === "live" || Date.parse(startTime) <= now) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-red-400">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-red-400" />
        </span>
        LIVE
      </span>
    );
  }
  return <span title={formatGameDateTime(startTime)}>{formatGameStart(startTime, now)}</span>;
}
