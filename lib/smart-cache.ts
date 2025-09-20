"use client";

import { performanceMonitor } from "./performance-monitor";
import { logComponents } from "../lib/utils/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  persistToStorage?: boolean; // Persist to localStorage
  storageKey?: string; // Key for localStorage
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
}

class SmartCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    memoryUsage: 0,
    entryCount: 0,
  };
  private options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      maxEntries: options.maxEntries || 1000,
      persistToStorage: options.persistToStorage || false,
      storageKey: options.storageKey || "smart-cache",
    };

    // Load from storage if enabled
    if (this.options.persistToStorage && typeof window !== "undefined") {
      this.loadFromStorage();
    }

    // Start cleanup interval (apenas no cliente)
    if (typeof window !== "undefined") {
      this.startCleanup();
    }
  }

  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default size if can't stringify
    }
  }

  private updateStats() {
    this.stats.totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate =
      this.stats.totalRequests > 0
        ? (this.stats.hits / this.stats.totalRequests) * 100
        : 0;
    this.stats.entryCount = this.cache.size;
    this.stats.memoryUsage = Array.from(this.cache.values()).reduce(
      (total, entry) => total + entry.size,
      0,
    );
  }

  private evictLRU() {
    if (this.cache.size === 0) return;

    // Find least recently used entry
    let lruKey = "";
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;

      performanceMonitor.trackCustomMetric("Cache: LRU Eviction", 1, "memory");
    }
  }

  private evictExpired() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    if (expiredKeys.length > 0) {
      performanceMonitor.trackCustomMetric(
        "Cache: Expired Evictions",
        expiredKeys.length,
        "memory",
      );
    }
  }

  private enforceMemoryLimit() {
    while (
      this.stats.memoryUsage > this.options.maxSize &&
      this.cache.size > 0
    ) {
      this.evictLRU();
      this.updateStats();
    }
  }

  private enforceEntryLimit() {
    while (this.cache.size > this.options.maxEntries) {
      this.evictLRU();
    }
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.evictExpired();
      this.updateStats();

      if (this.options.persistToStorage) {
        this.saveToStorage();
      }
    }, 60000); // Cleanup every minute
  }

  private loadFromStorage() {
    // DEPRECATED: localStorage loading disabled
    // Cache starts fresh on each session for better data consistency
    console.warn("DEPRECATED: Smart cache localStorage loading disabled - starting with fresh cache");
  }

  private saveToStorage() {
    // DEPRECATED: localStorage persistence disabled
    // Cache now only persists in memory for better performance
    console.warn("DEPRECATED: Smart cache localStorage persistence disabled - using memory-only cache");
  }

  // Public methods
  get(key: string): T | null {
    const startTime = performance.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateStats();

      performanceMonitor.trackCustomMetric(
        "Cache: Miss",
        performance.now() - startTime,
        "storage",
      );

      return null;
    }

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      this.updateStats();

      performanceMonitor.trackCustomMetric(
        "Cache: Expired Miss",
        performance.now() - startTime,
        "storage",
      );

      return null;
    }

    // Update access info
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.stats.hits++;
    this.updateStats();

    performanceMonitor.trackCustomMetric(
      "Cache: Hit",
      performance.now() - startTime,
      "storage",
    );

    return entry.data;
  }

  set(key: string, data: T, customTTL?: number): void {
    const startTime = performance.now();
    const size = this.calculateSize(data);
    const now = Date.now();
    const ttl = customTTL || this.options.ttl;

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      size,
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, entry);
    this.updateStats();

    // Enforce limits
    this.enforceEntryLimit();
    this.enforceMemoryLimit();

    performanceMonitor.trackCustomMetric(
      "Cache: Set",
      performance.now() - startTime,
      "storage",
    );
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.updateStats();
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.updateStats();
    }
    return result;
  }

  /** @deprecated localStorage persistence will be removed */
  clear(): void {
    console.warn('DEPRECATED: smart-cache clear() - localStorage persistence será removido');
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      memoryUsage: 0,
      entryCount: 0,
    };

    if (
      this.options.persistToStorage &&
      typeof window !== "undefined" &&
      window.localStorage
    ) {
      localStorage.removeItem(this.options.storageKey);
    }
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  // Advanced methods
  getOrSet(
    key: string,
    factory: () => T | Promise<T>,
    customTTL?: number,
  ): T | Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const result = factory();

    if (result instanceof Promise) {
      return result.then((data) => {
        this.set(key, data, customTTL);
        return data;
      });
    } else {
      this.set(key, result, customTTL);
      return result;
    }
  }

  invalidatePattern(pattern: RegExp): number {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
    this.updateStats();

    return keysToDelete.length;
  }

  getTopEntries(
    limit: number = 10,
  ): Array<{ key: string; accessCount: number; size: number }> {
    return Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        size: entry.size,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  optimize(): void {
    // Remove expired entries
    this.evictExpired();

    // If still over memory limit, remove least accessed entries
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.accessCount - b.accessCount,
    );

    while (
      this.stats.memoryUsage > this.options.maxSize * 0.8 &&
      entries.length > 0
    ) {
      const [key] = entries.shift()!;
      this.cache.delete(key);
      this.stats.evictions++;
    }

    this.updateStats();

    performanceMonitor.trackCustomMetric("Cache: Optimization", 1, "memory");
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.options.persistToStorage) {
      this.saveToStorage();
    }

    this.clear();
  }
}

// Global cache instances
export const dataCache = new SmartCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 5 * 1024 * 1024, // 5MB
  maxEntries: 500,
  persistToStorage: false, // Desabilitado temporariamente para evitar erros de servidor
  storageKey: "app-data-cache",
});

export const apiCache = new SmartCache({
  ttl: 2 * 60 * 1000, // 2 minutes
  maxSize: 3 * 1024 * 1024, // 3MB
  maxEntries: 300,
  persistToStorage: false,
  storageKey: "app-api-cache",
});

export const imageCache = new SmartCache({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 10 * 1024 * 1024, // 10MB
  maxEntries: 100,
  persistToStorage: false, // Desabilitado temporariamente para evitar erros de servidor
  storageKey: "app-image-cache",
});

// Utility functions
export function createCachedFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn | Promise<TReturn>,
  options: {
    cache?: SmartCache;
    keyGenerator?: (...args: TArgs) => string;
    ttl?: number;
  } = {},
) {
  const cache = options.cache || dataCache;
  const keyGenerator =
    options.keyGenerator || ((...args) => JSON.stringify(args));

  return async (...args: TArgs): Promise<TReturn> => {
    const key = `fn:${fn.name}:${keyGenerator(...args)}`;

    return cache.getOrSet(
      key,
      () => fn(...args),
      options.ttl,
    ) as Promise<TReturn>;
  };
}

export function invalidateCache(pattern: string | RegExp) {
  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

  const results = {
    data: dataCache.invalidatePattern(regex),
    api: apiCache.invalidatePattern(regex),
    image: imageCache.invalidatePattern(regex),
  };

  return results;
}

export function getCacheStats() {
  return {
    data: dataCache.getStats(),
    api: apiCache.getStats(),
    image: imageCache.getStats(),
  };
}

export { SmartCache };
export type { CacheEntry, CacheOptions, CacheStats };
