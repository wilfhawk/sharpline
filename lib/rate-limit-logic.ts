export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export function getRateLimitDecision(
  count: number,
  limit: number,
  resetAt: number
): RateLimitDecision {
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt,
  };
}

export function consumeRateLimitBucket(
  current: RateLimitBucket | undefined,
  limit: number,
  windowSeconds: number,
  now: number
): { bucket: RateLimitBucket; decision: RateLimitDecision } {
  const bucket = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowSeconds * 1000 }
    : { count: current.count + 1, resetAt: current.resetAt };

  return {
    bucket,
    decision: getRateLimitDecision(bucket.count, limit, bucket.resetAt),
  };
}