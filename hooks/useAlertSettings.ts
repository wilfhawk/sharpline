"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sharpline:alert-settings";
const EVENT_NAME = "sharpline:alert-settings-changed";

export interface AlertSettings {
  enabled: boolean;
  thresholdPercent: number;
}

const DEFAULT_SETTINGS: AlertSettings = { enabled: false, thresholdPercent: 5 };
let cachedSettings: AlertSettings | null = null;

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
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULT_SETTINGS
  );

  function subscribe(onStoreChange: () => void) {
    const onChange = () => {
      cachedSettings = null;
      onStoreChange();
    };
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  function getSnapshot() {
    cachedSettings ??= readStoredSettings();
    return cachedSettings;
  }

  const setSettings = useCallback((next: AlertSettings) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedSettings = next;
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { settings, setSettings };
}
