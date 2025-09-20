/**
 * Cache Manager
 * Intelligent caching with TTL and invalidation
 */

import { CacheEntry } from "./types";
import { logComponents } from "../lib/utils/logger";

export interface CacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
}

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats = {
    totalHits: 0,
    totalMisses: 0,
  };
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
    // localStorage cache functionality has been removed
  }

  private startCleanupInterval() {
    // Clean expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000);
  }

  private cleanupExpired() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.memoryCache.delete(key);
    });

    // localStorage cache functionality has been removed
  }



  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      const now = Date.now();
      if (now <= memoryEntry.timestamp + memoryEntry.ttl) {
        this.stats.totalHits++;
        return memoryEntry.data;
      } else {
        // Expired, remove from memory
        this.memoryCache.delete(key);
      }
    }

    // localStorage cache functionality has been removed - only using memory cache

    this.stats.totalMisses++;
    return null;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Enforce memory limit
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      this.evictOldest();
    }

    // localStorage cache functionality has been removed - only using memory cache
  }

  private evictOldest() {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
    }
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    // localStorage cache functionality has been removed
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToRemove: string[] = [];

    // Remove from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      this.memoryCache.delete(key);
    });

    // localStorage cache functionality has been removed
  }

  clear(): void {
    this.memoryCache.clear();
    // localStorage cache functionality has been removed
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;

    return {
      totalEntries: this.memoryCache.size,
      memoryUsage: this.calculateMemoryUsage(),
      hitRate: totalRequests > 0 ? this.stats.totalHits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.totalMisses / totalRequests : 0,
      totalHits: this.stats.totalHits,
      totalMisses: this.stats.totalMisses,
    };
  }

  private calculateMemoryUsage(): number {
    // Rough estimation of memory usage
    let size = 0;
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate (UTF-16)
    }
    return size;
  }

  // Persistence methods (localStorage functionality has been removed)
  persist(): void {
    // localStorage cache functionality has been removed - this method is now a no-op
  }

  restore(): void {
    // localStorage cache functionality has been removed - this method is now a no-op
  }

  // Cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}
