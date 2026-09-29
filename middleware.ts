import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Geofencing hook stub (see COMPLIANCE.md) — always allows for now. Wire this up to a
 * real state/country ruleset only if legal counsel advises geofencing before launch.
 */
function geoCheck(_request: NextRequest): { allowed: boolean } {
  return { allowed: true };
}

export async function middleware(request: NextRequest) {
  geoCheck(request);

  // No Supabase project wired up yet (mock-data-only dev mode) — nothing to check.
  if (!isSupabaseConfigured()) {
    return;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
