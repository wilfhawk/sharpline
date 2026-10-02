import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  consumeRateLimitBucket,
  type RateLimitBucket,
  type RateLimitDecision,
} from "@/lib/rate-limit-logic";

const localBuckets = new Map<string, RateLimitBucket>();

export function getClientAddress(request: NextRequest): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedAddress = forwardedFor?.split(",", 1)[0]?.trim();
  return forwardedAddress || null;
}

function hashRateLimitKey(scope: string, address: string): string {
  return createHash("sha256").update(`${scope}:${address}`).digest("hex");
}

function consumeLocalBucket(
  key: string,
  limit: number,
  windowSeconds: number,
  now: number
): RateLimitDecision {
  const result = consumeRateLimitBucket(localBuckets.get(key), limit, windowSeconds, now);
  localBuckets.set(key, result.bucket);
  return result.decision;
}

export async function enforcePublicRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowSeconds = 60
): Promise<NextResponse | null> {
  const address = getClientAddress(request);
  if (!address) {
    return NextResponse.json(
      { error: "Request could not be rate limited." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const key = hashRateLimitKey(scope, address);
  const now = Date.now();
  let decision: RateLimitDecision;

  if (process.env.NODE_ENV === "production") {
    if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Shared public API rate limiting is not configured; using instance-local limits");
      decision = consumeLocalBucket(key, limit, windowSeconds, now);
    } else {
      try {
        const { data, error } = await createAdminClient().rpc(
          "consume_api_rate_limit",
          {
            p_rate_key: key,
            p_window_seconds: windowSeconds,
            p_limit: limit,
          }
        );
        const result = Array.isArray(data) ? data[0] : data;
        if (error || !result) {
          console.error("Public API rate limit RPC unavailable; using instance-local limits", error?.code ?? "empty result");
          decision = consumeLocalBucket(key, limit, windowSeconds, now);
        } else {
          decision = {
            allowed: result.allowed,
            remaining: result.remaining,
            resetAt: new Date(result.reset_at).getTime(),
          };
        }
      } catch (error) {
        console.error("Public API rate limit RPC request failed; using instance-local limits", error instanceof Error ? error.name : "UnknownError");
        decision = consumeLocalBucket(key, limit, windowSeconds, now);
      }
    }
  } else {
    decision = consumeLocalBucket(key, limit, windowSeconds, now);
  }

  if (decision.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((decision.resetAt - now) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(decision.resetAt / 1000)),
      },
    }
  );
}