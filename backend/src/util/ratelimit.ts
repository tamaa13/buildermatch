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

import { config } from "../config";

// Per-client-IP: 10 profile builds / minute. Coarse protection.
export const profileBuildLimiter = new RateLimiter(10, 10 / 60_000);

// Per-wallet: default 1 build / hour. DEMO_MODE relaxes to 1/sec so a demoer
// can rebuild a profile on camera without waiting. Per-IP limit stays strict
// in both modes (protects Anthropic credits during automated testing).
export const profileBuildPerWalletLimiter = config.demoMode
  ? new RateLimiter(1, 1 / 1_000) // 1 per second
  : new RateLimiter(1, 1 / (60 * 60_000)); // 1 per hour
