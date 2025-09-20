import React from "react";

import { logComponents } from "../logger";
// Implementacao propria de debounce para evitar dependencia externa
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Interfaces para batch operations
interface BatchOperation {
  key: string;
  data: any[];
  timestamp: number;
}

interface PendingWrite {
  key: string;
  data: any[];
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Sistema otimizado de localStorage com debounce e batch updates
 * Reduz significativamente as operacoes de escrita para melhor performance
 */
export class OptimizedStorage {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Batch operations
  private pendingWrites = new Map<string, PendingWrite>();
  private batchQueue: BatchOperation[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly DEBOUNCE_DELAY = 300; // 300ms

  // Performance metrics
  private writeCount = 0;
  private batchCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    this.debouncedBatchWrite = debounce(
      this.processBatchWrites.bind(this),
      this.DEBOUNCE_DELAY,
    );
    this.setupPerformanceMonitoring();
  }

  private debouncedBatchWrite: () => void;

  private setupPerformanceMonitoring(): void {
    if (typeof window !== "undefined") {
      // Log performance metrics every 30 seconds
      setInterval(() => {
        if (this.writeCount > 0 || this.cacheHits > 0) {
          console.log("📊 Storage Performance:", {
            writes: this.writeCount,
            batches: this.batchCount,
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses,
            hitRate: `${((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(1)}%`,
          });
        }
      }, 30000);
    }
  }

  private isClient(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined";
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    const expiry = this.cacheExpiry.get(key);

    if (cached && expiry && Date.now() < expiry) {
      this.cacheHits++;
      return cached;
    }

    if (cached) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    }

    this.cacheMisses++;
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  /**
   * Leitura otimizada com cache inteligente
   */
  getFromStorage<T>(key: string): T[] {
    // Buscar apenas do cache em memória
    const cached = this.getFromCache<T[]>(key);
    if (cached) {
      return cached;
    }

    // Se não está no cache, retornar array vazio (dados vêm do banco)
    return [];
  }

  /**
   * Escrita otimizada com debounce e batch processing
   */
  async saveToStorage<T>(key: string, data: T[]): Promise<void> {
    if (!this.isClient()) return;

    if (!Array.isArray(data)) {
      logComponents.error("Attempting to save non-array data for key ${key}:", data);
      return;
    }

    // Atualiza o cache imediatamente para leituras sincronas
    this.setCache(key, data);

    // Retorna uma Promise para operacoes assincronas
    return new Promise((resolve, reject) => {
      // Cancela escrita pendente anterior para a mesma chave
      const existingWrite = this.pendingWrites.get(key);
      if (existingWrite) {
        existingWrite.resolve(); // Resolve a anterior
      }

      // Adiciona nova operação pendente
      this.pendingWrites.set(key, { key, data, resolve, reject });

      // Adiciona a fila de batch
      const existingBatchIndex = this.batchQueue.findIndex(
        (op) => op.key === key,
      );
      const batchOperation: BatchOperation = {
        key,
        data,
        timestamp: Date.now(),
      };

      if (existingBatchIndex >= 0) {
        this.batchQueue[existingBatchIndex] = batchOperation;
      } else {
        this.batchQueue.push(batchOperation);
      }

      // Processa batch se atingiu o tamanho maximo ou usa debounce
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        this.processBatchWrites();
      } else {
        this.debouncedBatchWrite();
      }
    });
  }

  /**
   * Processa todas as escritas em batch
   */
  private processBatchWrites(): void {
    if (this.batchQueue.length === 0) return;

    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.batchCount++;

    // Agrupa operacoes por prioridade (mais recentes primeiro)
    const sortedOps = operations.sort((a, b) => b.timestamp - a.timestamp);
    const uniqueOps = new Map<string, BatchOperation>();

    // Remove duplicatas, mantendo apenas a operacao mais recente para cada chave
    sortedOps.forEach((op) => {
      if (!uniqueOps.has(op.key)) {
        uniqueOps.set(op.key, op);
      }
    });

    // Executa as escritas em batch (apenas cache, dados vão para o banco via dataService)
    const writePromises = Array.from(uniqueOps.values()).map(
      async (operation) => {
        try {
          // Apenas atualizar cache em memória
          this.setCache(operation.key, operation.data);
          this.writeCount++;

          // Resolve a Promise pendente
          const pendingWrite = this.pendingWrites.get(operation.key);
          if (pendingWrite) {
            pendingWrite.resolve();
            this.pendingWrites.delete(operation.key);
          }
        } catch (error) {
          logComponents.error("Batch write error for key ${operation.key}:", error);

          // Rejeita a Promise pendente
          const pendingWrite = this.pendingWrites.get(operation.key);
          if (pendingWrite) {
            pendingWrite.reject(error as Error);
            this.pendingWrites.delete(operation.key);
          }
        }
      },
    );

    // Aguarda todas as escritas completarem
    Promise.all(writePromises).catch((error) => {
      logComponents.error("Batch write operation failed:", error);
    });
  }

  /**
   * Forca a escrita imediata de todas as operacoes pendentes
   */
  async flushPendingWrites(): Promise<void> {
    this.debouncedBatchWrite.cancel();
    this.processBatchWrites();

    // Aguarda todas as operacoes pendentes completarem
    const pendingPromises = Array.from(this.pendingWrites.values()).map(
      (write) =>
        new Promise<void>((resolve) => {
          const originalResolve = write.resolve;
          write.resolve = () => {
            originalResolve();
            resolve();
          };
        }),
    );

    await Promise.all(pendingPromises);
  }

  /**
   * Limpa o cache e força reload dos dados
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Obtem estatisticas de performance
   */
  getPerformanceStats() {
    return {
      writeCount: this.writeCount,
      batchCount: this.batchCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      pendingWrites: this.pendingWrites.size,
      queuedOperations: this.batchQueue.length,
    };
  }

  /**
   * Reseta as metricas de performance
   */
  resetPerformanceStats(): void {
    this.writeCount = 0;
    this.batchCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Instancia singleton otimizada
export const optimizedStorage = new OptimizedStorage();

// Hook para React que fornece estatisticas de performance
export function useStoragePerformance() {
  const [stats, setStats] = React.useState(
    optimizedStorage.getPerformanceStats(),
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(optimizedStorage.getPerformanceStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}

// Utilitarios para migracao gradual
export function createOptimizedStorageAdapter(originalStorage: any) {
  return {
    ...originalStorage,

    // Sobrescreve metodos de escrita para usar otimizacao
    async saveToStorage<T>(key: string, data: T[]): Promise<void> {
      return optimizedStorage.saveToStorage(key, data);
    },

    getFromStorage<T>(key: string): T[] {
      return optimizedStorage.getFromStorage<T>(key);
    },

    // Metodos de performance
    flushPendingWrites: () => optimizedStorage.flushPendingWrites(),
    clearCache: () => optimizedStorage.clearCache(),
    getPerformanceStats: () => optimizedStorage.getPerformanceStats(),
  };
}
