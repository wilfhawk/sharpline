"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { EMPTY_PROFILE, sanitizeProfile, type DashboardProfile } from "@/lib/dashboard-profile";

const STORAGE_KEY = "sharpline:dashboard-profile";
const QUERY_KEY = ["dashboard-profile"] as const;

interface ProfileState {
  profile: DashboardProfile;
  /** True when signed in, so changes are also saved to the account. */
  synced: boolean;
}

function readLocal(): DashboardProfile {
  try {
    return sanitizeProfile(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null"));
  } catch {
    return EMPTY_PROFILE;
  }
}

function writeLocal(profile: DashboardProfile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage may be unavailable (private mode); the in-memory profile still applies.
  }
}

async function pushToAccount(profile: DashboardProfile): Promise<boolean> {
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadProfile(): Promise<ProfileState> {
  const local = readLocal();
  try {
    const response = await fetch("/api/profile");
    if (response.ok) {
      const body = await response.json();
      if (body.profile) {
        const profile = sanitizeProfile(body.profile);
        writeLocal(profile);
        return { profile, synced: true };
      }
      // Signed in with nothing saved yet: promote this device's choices to the account.
      if (local.leagues.length > 0 || local.sportsbooks.length > 0) await pushToAccount(local);
      return { profile: local, synced: true };
    }
  } catch {
    // Offline or not configured: fall back to this device.
  }
  return { profile: local, synced: false };
}

/**
 * The viewer's dashboard profile (leagues + sportsbooks to show; empty = all).
 * Stored on this device always, and on the account too when signed in.
 */
export function useDashboardProfile() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: loadProfile, staleTime: Infinity, retry: false });
  const state = query.data;

  const save = useCallback(
    (next: DashboardProfile) => {
      const clean = sanitizeProfile(next);
      writeLocal(clean);
      const synced = queryClient.getQueryData<ProfileState>(QUERY_KEY)?.synced ?? false;
      queryClient.setQueryData<ProfileState>(QUERY_KEY, { profile: clean, synced });
      if (synced) void pushToAccount(clean);
    },
    [queryClient]
  );

  return {
    profile: state?.profile ?? EMPTY_PROFILE,
    synced: state?.synced ?? false,
    isReady: query.isFetched,
    save,
  };
}
