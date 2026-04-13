type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

const store = new Map<string, RateLimitEntry>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  cleanup(now);

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}
