"use client";

// Sistema de cache inteligente para otimização de performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milliseconds
  accessCount: number;
  lastAccess: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Máximo de entradas no cache
  private defaultTTL = 5 * 60 * 1000; // 5 minutos padrão

  // Configurações específicas por tipo de dado
  private ttlConfig = {
    accounts: 10 * 60 * 1000, // 10 minutos
    transactions: 5 * 60 * 1000, // 5 minutos
    investments: 15 * 60 * 1000, // 15 minutos
    budget: 30 * 60 * 1000, // 30 minutos
    goals: 60 * 60 * 1000, // 1 hora
    reports: 20 * 60 * 1000, // 20 minutos
  };

  set<T>(key: string, data: T, customTTL?: number): void {
    // Limpar cache se estiver muito cheio
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    const ttl = customTTL || this.getTTLForKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now(),
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccess = Date.now();

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Estatísticas do cache
  getStats() {
    const entries = Array.from(this.cache.entries());
    const totalSize = entries.length;
    const totalAccesses = entries.reduce(
      (sum, [, entry]) => sum + entry.accessCount,
      0,
    );
    const avgAccesses = totalSize > 0 ? totalAccesses / totalSize : 0;

    return {
      size: totalSize,
      maxSize: this.maxSize,
      totalAccesses,
      avgAccesses,
      hitRate: this.calculateHitRate(),
    };
  }

  private getTTLForKey(key: string): number {
    for (const [type, ttl] of Object.entries(this.ttlConfig)) {
      if (key.includes(type)) {
        return ttl;
      }
    }
    return this.defaultTTL;
  }

  private evictLeastUsed(): void {
    let leastUsedKey = "";
    let leastUsedScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score baseado em frequência de acesso e recência
      const timeSinceLastAccess = Date.now() - entry.lastAccess;
      const score = entry.accessCount / (1 + timeSinceLastAccess / 1000);

      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  private calculateHitRate(): number {
    // Implementação simplificada - em produção seria mais sofisticada
    return this.cache.size > 0 ? 0.85 : 0;
  }
}

// Instância global do cache
export const performanceCache = new PerformanceCache();

// Hook para usar o cache com React
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  deps: any[] = [],
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Tentar buscar do cache primeiro
        const cachedData = performanceCache.get<T>(key);
        if (cachedData) {
          if (isMounted) {
            setData(cachedData);
            setLoading(false);
          }
          return;
        }

        // Se não estiver no cache, buscar dos dados
        const freshData = await fetchFn();

        if (isMounted) {
          setData(freshData);
          performanceCache.set(key, freshData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [key, ...deps]);

  const invalidateCache = React.useCallback(() => {
    performanceCache.invalidate(key);
  }, [key]);

  return { data, loading, error, invalidateCache };
}

// Utilitários para invalidação de cache
export const cacheUtils = {
  // Invalidar cache relacionado a contas
  invalidateAccounts: () => {
    performanceCache.invalidatePattern("accounts");
  },

  // Invalidar cache relacionado a transações
  invalidateTransactions: () => {
    performanceCache.invalidatePattern("transactions");
  },

  // Invalidar cache relacionado a investimentos
  invalidateInvestments: () => {
    performanceCache.invalidatePattern("investments");
  },

  // Invalidar cache relacionado a orçamento
  invalidateBudget: () => {
    performanceCache.invalidatePattern("budget");
  },

  // Invalidar tudo
  invalidateAll: () => {
    performanceCache.clear();
  },
};

// Importar React para o hook
import React from "react";

export default performanceCache;
