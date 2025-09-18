const DEFAULT_WINDOW_MS = 60_000; // 1 minuto
const DEFAULT_MAX_REQUESTS = 60;

const buckets = new Map<string, { count: number; expiresAt: number }>();

type RateLimitConfig = {
  windowMs?: number;
  maxRequests?: number;
};

type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfter: number };

export function checkRateLimit(key: string, config: RateLimitConfig = {}): RateLimitResult {
  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  const existing = buckets.get(key);
  if (!existing || existing.expiresAt <= now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { ok: false, retryAfter: Math.ceil((existing.expiresAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, remaining: maxRequests - existing.count };
}

export function extractClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip');
  if (forwarded) {
    const [first] = forwarded.split(',');
    if (first) return first.trim();
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return 'anonymous';
}
