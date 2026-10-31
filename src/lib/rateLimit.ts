/**
 * Distributed and sliding-window rate limiter for sensitive authentication,
 * checkout, and payment endpoints. Supports Upstash Redis when configured,
 * with fallback to in-memory sliding window.
 */
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records every 10 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 600000);
}

/**
 * Reset rate limit records for testing purposes only.
 */
export function _resetRateLimitsForTesting() {
  rateLimitStore.clear();
}

/**
 * Distributed rate limiter via Upstash Redis REST API when provisioned.
 */
async function checkUpstashRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const key = `ratelimit:${identifier}`;
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds],
      ]),
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const currentCount = Number(data[0]?.result || 1);
    if (currentCount > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: windowSeconds,
      };
    }
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - currentCount),
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.warn('Upstash Redis rate limit check failed, falling back to in-memory:', err);
    return null;
  }
}

/**
 * In-memory sliding-window rate limit check.
 */
export function checkInMemoryRateLimit(
  identifier: string,
  maxRequests = 10,
  windowSeconds = 60
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Remove timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldestTimestamp = record.timestamps[0];
    const retryAfterMs = oldestTimestamp + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Primary rate limit check: Tries Upstash Redis if available, else in-memory sliding window.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const distributed = await checkUpstashRateLimit(identifier, maxRequests, windowSeconds);
    if (distributed) return distributed;
  }

  return checkInMemoryRateLimit(identifier, maxRequests, windowSeconds);
}

/**
 * Securely extracts client IP, resisting X-Forwarded-For spoofing attacks.
 * Vendor-trusted headers (Cloudflare, Vercel, Fly) take precedence.
 * For x-forwarded-for, takes the rightmost IP appended by the trusted proxy hop.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp?.trim()) return cfIp.trim();

  const vercelIp = request.headers.get('x-vercel-ip');
  if (vercelIp?.trim()) return vercelIp.trim();

  const flyIp = request.headers.get('fly-client-ip');
  if (flyIp?.trim()) return flyIp.trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp?.trim()) return realIp.trim();

  // If x-forwarded-for is present, take the last IP (appended by the nearest trusted gateway/proxy),
  // NEVER the first element (which can be client-forged).
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }

  return '127.0.0.1';
}
