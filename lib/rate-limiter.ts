interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil?: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits: Map<string, RateLimitEntry> = new Map();

  private readonly configs: Record<string, RateLimitConfig> = {
    login: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    }, // 5 attempts per 15min, block for 30min
    transaction: {
      maxRequests: 100,
      windowMs: 60 * 1000,
      blockDurationMs: 5 * 60 * 1000,
    }, // 100 per minute, block for 5min
    api: { maxRequests: 1000, windowMs: 60 * 1000, blockDurationMs: 60 * 1000 }, // 1000 per minute, block for 1min
    default: {
      maxRequests: 60,
      windowMs: 60 * 1000,
      blockDurationMs: 60 * 1000,
    }, // 60 per minute, block for 1min
  };

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private getKey(identifier: string, action: string): string {
    return `${identifier}:${action}`;
  }

  private getClientIdentifier(): string {
    if (!this.isClient()) return "server";

    // DEPRECADO: localStorage será removido em favor de identificação segura
    console.warn('RateLimiter: localStorage está deprecado para identificação de cliente');
    // In production, use actual client IP or user ID
    return localStorage.getItem("sua-grana-client-id") || "anonymous";
  }

  checkLimit(
    action: string,
    identifier?: string,
  ): { allowed: boolean; resetTime?: number; retryAfter?: number } {
    const clientId = identifier || this.getClientIdentifier();
    const key = this.getKey(clientId, action);
    const config = this.configs[action] || this.configs.default;
    const now = Date.now();

    let entry = this.limits.get(key);

    // Initialize entry if not exists
    if (!entry) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      this.limits.set(key, entry);
    }

    // Check if currently blocked
    if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        retryAfter: entry.blockedUntil - now,
      };
    }

    // Reset window if expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.windowMs;
      entry.blocked = false;
      entry.blockedUntil = undefined;
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + config.blockDurationMs;

      return {
        allowed: false,
        resetTime: entry.resetTime,
        retryAfter: config.blockDurationMs,
      };
    }

    // Increment counter
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      resetTime: entry.resetTime,
    };
  }

  recordRequest(action: string, identifier?: string): void {
    this.checkLimit(action, identifier);
  }

  getRemainingRequests(action: string, identifier?: string): number {
    const clientId = identifier || this.getClientIdentifier();
    const key = this.getKey(clientId, action);
    const config = this.configs[action] || this.configs.default;
    const entry = this.limits.get(key);

    if (!entry) return config.maxRequests;

    const now = Date.now();
    if (now >= entry.resetTime) return config.maxRequests;

    return Math.max(0, config.maxRequests - entry.count);
  }

  isBlocked(action: string, identifier?: string): boolean {
    const result = this.checkLimit(action, identifier);
    return !result.allowed;
  }

  clearLimits(identifier?: string): void {
    const clientId = identifier || this.getClientIdentifier();

    for (const [key] of Array.from(this.limits.entries())) {
      if (key.startsWith(clientId + ":")) {
        this.limits.delete(key);
      }
    }
  }

  // Cleanup old entries
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.limits.entries())) {
      if (
        now >= entry.resetTime &&
        (!entry.blockedUntil || now >= entry.blockedUntil)
      ) {
        this.limits.delete(key);
      }
    }
  }

  // Get current limits for monitoring
  getLimits(): Record<string, RateLimitConfig> {
    return { ...this.configs };
  }

  // Update configuration
  updateConfig(action: string, config: Partial<RateLimitConfig>): void {
    this.configs[action] = { ...this.configs[action], ...config };
  }
}

export const rateLimiter = RateLimiter.getInstance();

// Cleanup old entries every 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      rateLimiter.cleanup();
    },
    5 * 60 * 1000,
  );
}
