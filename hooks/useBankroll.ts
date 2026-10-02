"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "sharpline:bankroll";
const DEFAULT_BANKROLL = 1000;
const BANKROLL_EVENT = "sharpline:bankroll-changed";
let cachedBankroll: number | undefined;

function readStoredBankroll(): number {
  if (typeof window === "undefined") return DEFAULT_BANKROLL;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_BANKROLL;
}

/**
 * Device-local bankroll setting (no server persistence) used for Kelly stake
 * sizing. Synced across every component using this hook in the same tab via
 * a custom window event, since the native `storage` event only fires cross-tab.
 */
export function useBankroll() {
  const bankroll = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_BANKROLL);

  const setBankroll = useCallback((value: number) => {
    const safeValue = Number.isFinite(value) && value >= 0 ? value : 0;
    window.localStorage.setItem(STORAGE_KEY, String(safeValue));
    cachedBankroll = safeValue;
    window.dispatchEvent(new Event(BANKROLL_EVENT));
  }, []);

  return { bankroll, setBankroll };
}

function getSnapshot(): number {
  cachedBankroll ??= readStoredBankroll();
  return cachedBankroll;
}

function subscribe(onStoreChange: () => void) {
  const onChange = () => {
    cachedBankroll = undefined;
    onStoreChange();
  };
  window.addEventListener(BANKROLL_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(BANKROLL_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
