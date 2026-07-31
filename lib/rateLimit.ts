// Simple in-memory, per-serverless-instance rate limiter — enough to stop a
// single bot script hammering a public form. Not a distributed rate limiter
// (each Vercel function instance has its own memory), but that's the right
// tradeoff for a small storefront: zero new services/cost, blocks the
// realistic threat (naive spam scripts), and can be swapped for a shared
// store (e.g. Redis) later if real abuse shows up in the logs.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
