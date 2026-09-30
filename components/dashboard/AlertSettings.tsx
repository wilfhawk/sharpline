"use client";

import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAlertSettings } from "@/hooks/useAlertSettings";

/** Inline control for enabling toast alerts on new opportunities above an EV% threshold. */
export function AlertSettings() {
  const { settings, setSettings } = useAlertSettings();

  return (
    <div className="flex items-center gap-2 text-xs">
      <Button
        type="button"
        variant={settings.enabled ? "default" : "outline"}
        size="sm"
        className="h-7 gap-1.5"
        onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
      >
        <BellIcon className="size-3.5" />
        {settings.enabled ? "Alerts on" : "Alerts off"}
      </Button>
      {settings.enabled && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>above</span>
          <Input
            type="number"
            min={0}
            step={0.5}
            value={settings.thresholdPercent}
            onChange={(e) =>
              setSettings({ ...settings, thresholdPercent: Number(e.target.value) })
            }
            className="h-7 w-16 text-xs"
          />
          <span>% EV</span>
        </div>
      )}
    </div>
  );
}
