"use client";

import { useEffect } from "react";

import { useState } from "react";

// Otimizador de memoria para melhorar performance
class MemoryOptimizer {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private maxCacheSize = 100;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpeza automatica a cada 5 minutos
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  // Cache com TTL (Time To Live)
  set(key: string, data: any, ttlMinutes = 10) {
    // Se cache esta cheio, remove o mais antigo
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: this.deepClone(data),
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Verifica se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return this.deepClone(item.data);
  }

  // Remove itens expirados
  cleanup() {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clone profundo otimizado
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
    if (typeof obj === "object") {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  }

  // Remove um item específico
  remove(key: string) {
    this.cache.delete(key);
  }

  // Limpa todo o cache
  clear() {
    this.cache.clear();
  }

  // Estatísticas de uso
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      usage: `${((this.cache.size / this.maxCacheSize) * 100).toFixed(1)}%`,
    };
  }

  // Destruir o otimizador
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

export const memoryOptimizer = new MemoryOptimizer();

// Hook para otimizacao de componentes React
export function useMemoryOptimization() {
  const [memoryStats, setMemoryStats] = useState(memoryOptimizer.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryStats(memoryOptimizer.getStats());
    }, 30000); // Atualiza a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    stats: memoryStats,
    clearCache: () => memoryOptimizer.clear(),
    optimizer: memoryOptimizer,
  };
}
