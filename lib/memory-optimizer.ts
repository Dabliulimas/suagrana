"use client";

import { useEffect } from "react";

import { useState } from "react";

// Otimizador de memoria otimizado para baixo uso de memória
class MemoryOptimizer {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number; size: number }
  >();
  private maxCacheSize = 50; // Reduzido de 100 para 50
  private maxMemoryMB = 5; // Limite de 5MB
  private currentMemoryMB = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpeza automatica a cada 2 minutos (mais frequente)
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      2 * 60 * 1000,
    );

    // Verificação de memória a cada 30 segundos
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 30 * 1000);
  }

  // Cache com TTL (Time To Live) e controle de memória
  set(key: string, data: any, ttlMinutes = 5) {
    // TTL reduzido para 5 minutos
    const clonedData = this.deepClone(data);
    const dataSize = this.calculateSize(clonedData);

    // Verificar se excede limite de memória
    if (this.currentMemoryMB + dataSize > this.maxMemoryMB) {
      this.evictToFitMemory(dataSize);
    }

    // Se cache esta cheio, remove o mais antigo
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      const oldEntry = this.cache.get(oldestKey);
      if (oldEntry) {
        this.currentMemoryMB -= oldEntry.size;
      }
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data: clonedData,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      size: dataSize,
    });

    this.currentMemoryMB += dataSize;
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

  // Remove itens expirados e controla memória
  cleanup() {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.currentMemoryMB -= item.size;
        this.cache.delete(key);
      }
    }
  }

  // Calcula tamanho aproximado dos dados em MB
  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size / (1024 * 1024);
    } catch {
      return 0.001; // 1KB default
    }
  }

  // Remove entradas para liberar memória
  private evictToFitMemory(requiredSize: number) {
    const entries = Array.from(this.cache.entries());
    // Ordenar por timestamp (mais antigo primeiro)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (const [key, entry] of entries) {
      if (this.currentMemoryMB + requiredSize <= this.maxMemoryMB) {
        break;
      }
      this.currentMemoryMB -= entry.size;
      this.cache.delete(key);
    }
  }

  // Verifica pressão de memória do sistema
  private checkMemoryPressure() {
    if (typeof window === "undefined") return;

    const memory = (performance as any).memory;
    if (!memory) return;

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    // Se uso de memória > 75%, fazer limpeza agressiva
    if (usagePercent > 75) {
      this.aggressiveCleanup();
    }
  }

  // Limpeza agressiva quando memória alta
  private aggressiveCleanup() {
    const entries = Array.from(this.cache.entries());
    const toRemove = Math.floor(entries.length * 0.6); // Remove 60%

    // Ordenar por timestamp (mais antigo primeiro)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);

    for (let i = 0; i < toRemove; i++) {
      const [key, entry] = entries[i];
      this.currentMemoryMB -= entry.size;
      this.cache.delete(key);
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

  // Remove um item especifico
  remove(key: string) {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemoryMB -= entry.size;
      this.cache.delete(key);
    }
  }

  // Limpa todo o cache
  clear() {
    this.cache.clear();
    this.currentMemoryMB = 0;
  }

  // Estatisticas de uso
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      usage: `${((this.cache.size / this.maxCacheSize) * 100).toFixed(1)}%`,
      memoryUsageMB: this.currentMemoryMB.toFixed(2),
      maxMemoryMB: this.maxMemoryMB,
      memoryUsage: `${((this.currentMemoryMB / this.maxMemoryMB) * 100).toFixed(1)}%`,
    };
  }

  // Destruir o otimizador
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
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
