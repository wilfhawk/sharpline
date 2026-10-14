import { z } from "zod";

/** Empty arrays mean "show all". */
export interface DashboardProfile {
  leagues: string[];
  sportsbooks: string[];
}

export const EMPTY_PROFILE: DashboardProfile = { leagues: [], sportsbooks: [] };

const MAX_ITEMS = 60;
const MAX_LENGTH = 80;

const list = z.array(z.string().trim().min(1).max(MAX_LENGTH)).max(MAX_ITEMS);

export const dashboardProfileSchema = z.object({ leagues: list, sportsbooks: list });

function dedupe(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const clean = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= MAX_LENGTH);
  return [...new Set(clean)].slice(0, MAX_ITEMS);
}

/** Coerces untrusted input (localStorage, query data) into a valid profile. */
export function sanitizeProfile(value: unknown): DashboardProfile {
  if (typeof value !== "object" || value === null) return EMPTY_PROFILE;
  const record = value as Record<string, unknown>;
  return { leagues: dedupe(record.leagues), sportsbooks: dedupe(record.sportsbooks) };
}

/** Parses a comma-separated query param into a clean list; null when absent or empty (no filtering). */
export function parseListParam(value: string | null): string[] | null {
  if (!value) return null;
  const items = dedupe(value.split(","));
  return items.length > 0 ? items : null;
}

export function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function isEmptyProfile(profile: DashboardProfile): boolean {
  return profile.leagues.length === 0 && profile.sportsbooks.length === 0;
}
