"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SubscriptionTier } from "@/lib/types";

const STORAGE_KEY = "sharpline:tier-preview";
const TIER_EVENT = "sharpline:tier-preview-changed";

/** null = no override, use the viewer's real subscription tier (or "free" when signed out). */
type TierPreview = SubscriptionTier | null;
let cachedTier: TierPreview | undefined;

function readStoredTier(): TierPreview {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "free" || stored === "plus" || stored === "pro" ? stored : null;
}

/**
 * Public, no-login "preview as Free / Plus / Pro" toggle (device-local, not a
 * real entitlement) so anyone — including the owner showing friends the tool —
 * can see any tier's experience without signing in or needing a Stripe
 * subscription. Synced across components in the same tab via a custom event,
 * same pattern as useBankroll/useAlertSettings.
 */
export function useTierPreview() {
  const tierPreview = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const setTierPreview = useCallback((value: TierPreview) => {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    cachedTier = value;
    window.dispatchEvent(new Event(TIER_EVENT));
  }, []);

  return { tierPreview, setTierPreview };
}

function getSnapshot(): TierPreview {
  if (cachedTier === undefined) cachedTier = readStoredTier();
  return cachedTier;
}

function subscribe(onStoreChange: () => void) {
  const onChange = () => {
    cachedTier = undefined;
    onStoreChange();
  };
  window.addEventListener(TIER_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(TIER_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
