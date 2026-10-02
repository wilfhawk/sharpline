export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
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