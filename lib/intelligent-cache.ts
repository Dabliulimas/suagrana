"use client";

import * as React from "react";
import { logComponents } from "../lib/utils/logger";

// Sistema de cache inteligente otimizado para baixo uso de memória

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: "low" | "medium" | "high";
  size: number;
}

interface CacheConfig {
  maxSize: number; // em MB
  maxEntries: number;
  defaultTTL: number; // em ms
  cleanupInterval: number; // em ms
  aggressiveCleanup: boolean; // limpeza agressiva quando memória alta
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private currentSize = 0;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 15, // Reduzido para 15MB
      maxEntries: 300, // Reduzido para 300 entradas
      defaultTTL: 2 * 60 * 1000, // Reduzido para 2 minutos
      cleanupInterval: 30 * 1000, // Limpeza a cada 30 segundos
      aggressiveCleanup: true,
      ...config,
    };

    this.startCleanupTimer();
    this.startMemoryMonitoring();
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private startMemoryMonitoring() {
    // Monitorar uso de memória e fazer limpeza agressiva se necessário
    if (typeof window !== "undefined" && this.config.aggressiveCleanup) {
      setInterval(() => {
        this.checkMemoryPressure();
      }, 15000); // Verificar a cada 15 segundos
    }
  }

  private checkMemoryPressure() {
    if (typeof window === "undefined") return;

    const memory = (performance as any).memory;
    if (!memory) return;

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    // Se uso de memória > 70%, fazer limpeza agressiva
    if (usagePercent > 70) {
      this.aggressiveCleanup();
    }
  }

  private aggressiveCleanup() {
    // Remover 50% das entradas menos usadas
    const entries = Array.from(this.cache.entries());
    const toRemove = Math.floor(entries.length * 0.5);

    // Ordenar por score (menos usado primeiro)
    entries.sort(([, a], [, b]) => {
      const scoreA = a.accessCount - (Date.now() - a.lastAccessed) / 60000;
      const scoreB = b.accessCount - (Date.now() - b.lastAccessed) / 60000;
      return scoreA - scoreB;
    });

    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size / (1024 * 1024); // MB
    } catch {
      return 0.001; // 1KB default
    }
  }

  private evictLeastUsed() {
    if (this.cache.size === 0) return;

    // Algoritmo LFU (Least Frequently Used) com consideração de prioridade
    let leastUsedKey = "";
    let leastScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score baseado em frequência de acesso, recência e prioridade
      const priorityMultiplier =
        entry.priority === "high" ? 3 : entry.priority === "medium" ? 2 : 1;
      const recencyScore = (Date.now() - entry.lastAccessed) / (1000 * 60); // minutos
      const score = entry.accessCount * priorityMultiplier - recencyScore;

      if (score < leastScore) {
        leastScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      const entry = this.cache.get(leastUsedKey)!;
      this.currentSize -= entry.size;
      this.cache.delete(leastUsedKey);
    }
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      // Remove entradas expiradas
      if (now - entry.timestamp > this.config.defaultTTL) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const entry = this.cache.get(key)!;
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }

    // Se ainda estiver acima do limite, remover entradas menos usadas
    while (
      this.cache.size > this.config.maxEntries ||
      this.currentSize > this.config.maxSize
    ) {
      this.evictLeastUsed();
    }
  }

  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: "low" | "medium" | "high";
    } = {},
  ): void {
    const size = this.calculateSize(data);
    const now = Date.now();

    // Se o item é muito grande, não armazenar
    if (size > this.config.maxSize * 0.1) {
      console.warn(`Cache item too large: ${key} (${size.toFixed(2)}MB)`);
      return;
    }

    // Remover entrada existente se houver
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!;
      this.currentSize -= existingEntry.size;
    }

    // Garantir espaço suficiente
    while (
      this.cache.size >= this.config.maxEntries ||
      this.currentSize + size > this.config.maxSize
    ) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      priority: options.priority || "medium",
      size,
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Verificar se expirou
    if (now - entry.timestamp > this.config.defaultTTL) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      currentSizeMB: this.currentSize,
      maxSizeMB: this.config.maxSize,
      maxEntries: this.config.maxEntries,
      hitRate: this.calculateHitRate(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        priority: entry.priority,
        sizeMB: entry.size,
        age: Date.now() - entry.timestamp,
      })),
    };
  }

  private calculateHitRate(): number {
    const totalAccesses = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0,
    );
    return totalAccesses > 0 ? (this.cache.size / totalAccesses) * 100 : 0;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Cache global para a aplicação
export const globalCache = new IntelligentCache({
  maxSize: 25, // Reduzido para 25MB
  maxEntries: 500, // Reduzido para 500 entradas
  defaultTTL: 3 * 60 * 1000, // Reduzido para 3 minutos
  cleanupInterval: 30 * 1000, // 30 segundos
  aggressiveCleanup: true,
});

// Cache específico para dados financeiros
export const financialCache = new IntelligentCache({
  maxSize: 20, // Reduzido para 20MB
  maxEntries: 400, // Reduzido para 400 entradas
  defaultTTL: 2 * 60 * 1000, // Reduzido para 2 minutos
  cleanupInterval: 30 * 1000, // 30 segundos
  aggressiveCleanup: true,
});

// Cache para componentes e UI
export const uiCache = new IntelligentCache({
  maxSize: 10, // Reduzido para 10MB
  maxEntries: 200, // Reduzido para 200 entradas
  defaultTTL: 5 * 60 * 1000, // Reduzido para 5 minutos
  cleanupInterval: 60 * 1000, // 1 minuto
  aggressiveCleanup: true,
});

// Hook para usar cache inteligente
export function useIntelligentCache<T>(
  key: string,
  fetchFn: () => Promise<T> | T,
  options: {
    cache?: IntelligentCache;
    ttl?: number;
    priority?: "low" | "medium" | "high";
    enabled?: boolean;
  } = {},
) {
  const {
    cache = globalCache,
    ttl,
    priority = "medium",
    enabled = true,
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    // Tentar buscar do cache primeiro
    const cachedData = cache.get<T>(key);
    if (cachedData !== null) {
      setData(cachedData);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();

      // Armazenar no cache
      cache.set(key, result, { ttl, priority });
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, cache, ttl, priority, enabled]);

  const invalidate = React.useCallback(() => {
    cache.delete(key);
    setData(null);
  }, [key, cache]);

  const refresh = React.useCallback(() => {
    invalidate();
    return fetchData();
  }, [invalidate, fetchData]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate,
    refresh,
  };
}

// Utilitários para cache
export const cacheUtils = {
  // Gerar chave de cache baseada em parâmetros
  generateKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${JSON.stringify(params[key])}`)
      .join("|");
    return `${prefix}:${sortedParams}`;
  },

  // Invalidar cache por padrão
  invalidatePattern: (cache: IntelligentCache, pattern: string): void => {
    const keys = Array.from(cache["cache"].keys());
    const regex = new RegExp(pattern);

    keys.forEach((key) => {
      if (regex.test(key)) {
        cache.delete(key);
      }
    });
  },

  // Pré-carregar dados no cache
  preload: async <T>(
    cache: IntelligentCache,
    key: string,
    fetchFn: () => Promise<T>,
    priority: "low" | "medium" | "high" = "low",
  ): Promise<void> => {
    try {
      const data = await fetchFn();
      cache.set(key, data, { priority });
    } catch (error) {
      console.warn(`Failed to preload cache key: ${key}`, error);
    }
  },

  // Obter estatísticas de todos os caches
  getAllStats: () => ({
    global: globalCache.getStats(),
    financial: financialCache.getStats(),
    ui: uiCache.getStats(),
  }),
};

// Cleanup automático quando a aplicação é fechada
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    globalCache.destroy();
    financialCache.destroy();
    uiCache.destroy();
  });
}

export { IntelligentCache };

const cacheExports = {
  IntelligentCache,
  globalCache,
  financialCache,
  uiCache,
  useIntelligentCache,
  cacheUtils,
};

export default cacheExports;
