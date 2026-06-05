/**
 * In-memory sliding-window rate limiter.
 * Tracks request timestamps per key (IP or userId) and rejects
 * requests that exceed the configured threshold within the window.
 *
 * Note: Resets on serverless cold starts. For production-grade
 * rate limiting, consider Redis or Vercel Edge Config.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name)!;
}

interface RateLimitConfig {
  /** Unique name for this limiter (e.g. 'login', 'signup') */
  name: string;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
}

/**
 * Check if a request from the given key is within rate limits.
 * Call this at the top of your route handler.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(config.name);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterSeconds: null,
  };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel's x-forwarded-for and common proxy headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

// Pre-configured rate limit configs
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  name: 'auth',
  maxRequests: 5,
  windowSeconds: 900, // 15 minutes
};

export const GAME_RATE_LIMIT: RateLimitConfig = {
  name: 'game',
  maxRequests: 20,
  windowSeconds: 300, // 5 minutes
};

export const CRON_RATE_LIMIT: RateLimitConfig = {
  name: 'cron',
  maxRequests: 2,
  windowSeconds: 300, // 5 minutes
};
