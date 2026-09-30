"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sharpline:alert-settings";
const EVENT_NAME = "sharpline:alert-settings-changed";

export interface AlertSettings {
  enabled: boolean;
  thresholdPercent: number;
}

const DEFAULT_SETTINGS: AlertSettings = { enabled: false, thresholdPercent: 5 };

function readStoredSettings(): AlertSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(stored);
    return {
      enabled: Boolean(parsed.enabled),
      thresholdPercent:
        Number.isFinite(parsed.thresholdPercent) && parsed.thresholdPercent >= 0
          ? parsed.thresholdPercent
          : DEFAULT_SETTINGS.thresholdPercent,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Device-local alert preferences (enabled + EV% threshold) for new-opportunity toasts. */
export function useAlertSettings() {
  const [settings, setSettingsState] = useState<AlertSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettingsState(readStoredSettings());
    function onChange() {
      setSettingsState(readStoredSettings());
    }
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);

  const setSettings = useCallback((next: AlertSettings) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { settings, setSettings };
}
