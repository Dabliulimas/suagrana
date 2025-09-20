"use client";

import React from "react";

interface ThrottledRequest {
  id: string;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
  retryCount: number;
  maxRetries: number;
}

interface RequestQueue {
  pending: ThrottledRequest[];
  processing: Set<string>;
  completed: Set<string>;
  failed: Set<string>;
}

class RequestThrottler {
  private queue: RequestQueue = {
    pending: [],
    processing: new Set(),
    completed: new Set(),
    failed: new Set(),
  };

  private maxConcurrent = 3;
  private requestsPerSecond = 5;
  private lastRequestTime = 0;
  private requestCount = 0;
  private resetInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Reset contador a cada segundo
    this.resetInterval = setInterval(() => {
      this.requestCount = 0;
    }, 1000);
  }

  // Throttle para funções de fetch
  async throttledFetch<T>(
    fetchFn: () => Promise<T>,
    options: {
      priority?: "low" | "medium" | "high" | "critical";
      maxRetries?: number;
      timeout?: number;
      cacheKey?: string;
    } = {},
  ): Promise<T> {
    const {
      priority = "medium",
      maxRetries = 3,
      timeout = 10000,
      cacheKey,
    } = options;

    // Verificar cache primeiro
    if (cacheKey && this.queue.completed.has(cacheKey)) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) return cached;
    }

    const requestId = this.generateRequestId();
    const request: ThrottledRequest = {
      id: requestId,
      timestamp: Date.now(),
      priority,
      retryCount: 0,
      maxRetries,
    };

    return new Promise((resolve, reject) => {
      this.enqueueRequest(request, fetchFn, resolve, reject, timeout, cacheKey);
    });
  }

  private enqueueRequest<T>(
    request: ThrottledRequest,
    fetchFn: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
    timeout: number,
    cacheKey?: string,
  ) {
    // Adicionar à fila baseado na prioridade
    const insertIndex = this.findInsertPosition(request.priority);
    this.queue.pending.splice(insertIndex, 0, request);

    // Processar fila
    this.processQueue(fetchFn, resolve, reject, timeout, cacheKey);
  }

  private findInsertPosition(priority: string): number {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const targetPriority =
      priorityOrder[priority as keyof typeof priorityOrder];

    for (let i = 0; i < this.queue.pending.length; i++) {
      const currentPriority =
        priorityOrder[
          this.queue.pending[i].priority as keyof typeof priorityOrder
        ];
      if (currentPriority > targetPriority) {
        return i;
      }
    }
    return this.queue.pending.length;
  }

  private async processQueue<T>(
    fetchFn: () => Promise<T>,
    resolve: (value: T) => void,
    reject: (error: any) => void,
    timeout: number,
    cacheKey?: string,
  ) {
    // Verificar limites
    if (this.queue.processing.size >= this.maxConcurrent) {
      setTimeout(
        () => this.processQueue(fetchFn, resolve, reject, timeout, cacheKey),
        100,
      );
      return;
    }

    if (this.requestCount >= this.requestsPerSecond) {
      const waitTime = 1000 - (Date.now() - this.lastRequestTime);
      if (waitTime > 0) {
        setTimeout(
          () => this.processQueue(fetchFn, resolve, reject, timeout, cacheKey),
          waitTime,
        );
        return;
      }
    }

    const request = this.queue.pending.shift();
    if (!request) return;

    this.queue.processing.add(request.id);
    this.requestCount++;
    this.lastRequestTime = Date.now();

    try {
      // Timeout para a requisição
      const timeoutPromise = new Promise<never>((_, timeoutReject) => {
        setTimeout(() => timeoutReject(new Error("Request timeout")), timeout);
      });

      const result = await Promise.race([fetchFn(), timeoutPromise]);

      // Cache do resultado se necessário
      if (cacheKey) {
        this.cacheResult(cacheKey, result);
      }

      this.queue.processing.delete(request.id);
      this.queue.completed.add(request.id);
      resolve(result);
    } catch (error) {
      this.queue.processing.delete(request.id);

      // Tentar novamente se possível
      if (request.retryCount < request.maxRetries) {
        request.retryCount++;
        request.timestamp = Date.now();

        // Delay exponencial para retry
        const delay = Math.min(1000 * Math.pow(2, request.retryCount), 10000);
        setTimeout(() => {
          this.enqueueRequest(
            request,
            fetchFn,
            resolve,
            reject,
            timeout,
            cacheKey,
          );
        }, delay);
      } else {
        this.queue.failed.add(request.id);
        reject(error);
      }
    }

    // Continuar processando a fila
    if (this.queue.pending.length > 0) {
      setTimeout(
        () => this.processQueue(fetchFn, resolve, reject, timeout, cacheKey),
        50,
      );
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cacheResult<T>(key: string, result: T) {
    // Implementação simples de cache em memória
    if (typeof window !== "undefined") {
      const cache = (window as any).__requestCache || new Map();
      cache.set(key, {
        result,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000, // 5 minutos
      });
      (window as any).__requestCache = cache;
    }
  }

  private getCachedResult<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    const cache = (window as any).__requestCache;
    if (!cache) return null;

    const cached = cache.get(key);
    if (!cached) return null;

    // Verificar TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
      cache.delete(key);
      return null;
    }

    return cached.result;
  }

  // Configurações dinâmicas
  setMaxConcurrent(max: number) {
    this.maxConcurrent = Math.max(1, Math.min(10, max));
  }

  setRequestsPerSecond(rps: number) {
    this.requestsPerSecond = Math.max(1, Math.min(20, rps));
  }

  // Estatísticas
  getStats() {
    return {
      pending: this.queue.pending.length,
      processing: this.queue.processing.size,
      completed: this.queue.completed.size,
      failed: this.queue.failed.size,
      maxConcurrent: this.maxConcurrent,
      requestsPerSecond: this.requestsPerSecond,
      currentRequestCount: this.requestCount,
    };
  }

  // Limpar estatísticas antigas
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutos

    // Limpar requests antigos
    this.queue.pending = this.queue.pending.filter(
      (req) => now - req.timestamp < maxAge,
    );

    // Limpar cache
    if (typeof window !== "undefined") {
      const cache = (window as any).__requestCache;
      if (cache) {
        for (const [key, value] of cache.entries()) {
          if (now - value.timestamp > value.ttl) {
            cache.delete(key);
          }
        }
      }
    }
  }

  // Pausar/retomar processamento
  pause() {
    this.maxConcurrent = 0;
  }

  resume() {
    this.maxConcurrent = 3;
    // Reprocessar fila
    if (this.queue.pending.length > 0) {
      this.processQueue(
        () => Promise.resolve(null),
        () => {},
        () => {},
        10000,
      );
    }
  }

  destroy() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
    this.queue.pending = [];
    this.queue.processing.clear();
    this.queue.completed.clear();
    this.queue.failed.clear();
  }
}

// Instância global
export const requestThrottler = new RequestThrottler();

// Hook para usar throttling em componentes
export function useThrottledRequest() {
  const throttledFetch = React.useCallback(
    <T>(
      fetchFn: () => Promise<T>,
      options?: Parameters<typeof requestThrottler.throttledFetch>[1],
    ) => {
      return requestThrottler.throttledFetch(fetchFn, options);
    },
    [],
  );

  const getStats = React.useCallback(() => {
    return requestThrottler.getStats();
  }, []);

  React.useEffect(() => {
    // Cleanup periódico
    const interval = setInterval(
      () => {
        requestThrottler.cleanup();
      },
      5 * 60 * 1000,
    ); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  return { throttledFetch, getStats };
}

// Wrapper para fetch nativo
export function createThrottledFetch() {
  return async function throttledFetch(
    url: string,
    options: RequestInit & {
      priority?: "low" | "medium" | "high" | "critical";
      maxRetries?: number;
      timeout?: number;
    } = {},
  ) {
    const { priority, maxRetries, timeout, ...fetchOptions } = options;

    return requestThrottler.throttledFetch(
      () =>
        fetch(url, fetchOptions).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          return res;
        }),
      { priority, maxRetries, timeout, cacheKey: url },
    );
  };
}

export default requestThrottler;
