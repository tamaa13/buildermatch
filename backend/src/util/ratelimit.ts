// Token-bucket limiter, per-IP, in-memory. Hackathon-scale — a restart flushes
// everyone's buckets, and a distributed deploy would need Redis, but both are
// out-of-scope until after demo.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  constructor(
    private capacity: number,
    private refillPerMs: number, // tokens added per millisecond
  ) {}

  take(key: string, cost = 1): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const b = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now };
    const elapsed = now - b.updatedAt;
    b.tokens = Math.min(this.capacity, b.tokens + elapsed * this.refillPerMs);
    b.updatedAt = now;
    if (b.tokens >= cost) {
      b.tokens -= cost;
      this.buckets.set(key, b);
      return { allowed: true, retryAfterMs: 0 };
    }
    this.buckets.set(key, b);
    const deficit = cost - b.tokens;
    return { allowed: false, retryAfterMs: Math.ceil(deficit / this.refillPerMs) };
  }
}

export const analyzeLimiter = new RateLimiter(5, 5 / 60_000);
