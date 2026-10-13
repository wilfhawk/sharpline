"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_TRACKER, parseTracker, type TrackerState } from "@/lib/book-tracker";

const STORAGE_KEY = "sharpline:book-tracker";
const CHANGE_EVENT = "sharpline:book-tracker-changed";

let cachedRaw: string | null | undefined;
let cachedState: TrackerState = EMPTY_TRACKER;

function getSnapshot(): TrackerState {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedState = parseTracker(raw);
  }
  return cachedState;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/** Device-local sportsbook balances, limits, and promos (never sent to the server). */
export function useBookTracker() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TRACKER);

  const update = useCallback((change: (current: TrackerState) => TrackerState) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(change(getSnapshot())));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { ...state, update };
}
