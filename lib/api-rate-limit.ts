import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getRateLimitDecision, type RateLimitDecision } from "@/lib/rate-limit-logic";

interface StoredBucket {
  count: number;
  resetAt: number;
}

const localBuckets = new Map<string, StoredBucket>();

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
  const current = localBuckets.get(key);
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowSeconds * 1000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  localBuckets.set(key, bucket);
  return getRateLimitDecision(bucket.count, limit, bucket.resetAt);
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
      return NextResponse.json(
        { error: "Request limiting is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
    }

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
        console.error("Public API rate limit check failed", error?.code ?? "empty result");
        return NextResponse.json(
          { error: "Request limiting is temporarily unavailable." },
          { status: 503, headers: { "Cache-Control": "no-store" } }
        );
      }
      decision = {
        allowed: result.allowed,
        remaining: result.remaining,
        resetAt: new Date(result.reset_at).getTime(),
      };
    } catch (error) {
      console.error("Public API rate limit request failed", error instanceof Error ? error.name : "UnknownError");
      return NextResponse.json(
        { error: "Request limiting is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "no-store" } }
      );
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