// In-memory rate limiter. Keyed by any string — use userId for authenticated
// endpoints, IP for unauthenticated ones. Each store is isolated per serverless
// function instance, so this is best-effort protection, not strict enforcement.
// Replace the Map backing with Upstash Redis before horizontal scale-out.

interface Entry { count: number; windowStart: number }

const stores = new Map<string, Map<string, Entry>>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSecs: number
}

export function rateLimit(
  storeId: string,
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  if (!stores.has(storeId)) stores.set(storeId, new Map())
  const store = stores.get(storeId)!
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: max - 1, retryAfterSecs: Math.ceil(windowMs / 1000) }
  }

  if (entry.count >= max) {
    const retryAfterSecs = Math.ceil((windowMs - (now - entry.windowStart)) / 1000)
    return { allowed: false, remaining: 0, retryAfterSecs }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, retryAfterSecs: Math.ceil(windowMs / 1000) }
}
