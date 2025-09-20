"use client";

import { memo, useMemo, useCallback, lazy, Suspense } from "react";
import { logComponents } from "./logger";
import { debounce } from "lodash";

// Sistema de cache inteligente para componentes
class ComponentCache {
  private cache = new Map<string, any>();
  private maxSize = 100;
  private accessCount = new Map<string, number>();

  set(key: string, value: any) {
    if (this.cache.size >= this.maxSize) {
      // Remove o item menos acessado
      const leastUsed = Array.from(this.accessCount.entries()).sort(
        ([, a], [, b]) => a - b,
      )[0];
      if (leastUsed) {
        this.cache.delete(leastUsed[0]);
        this.accessCount.delete(leastUsed[0]);
      }
    }
    this.cache.set(key, value);
    this.accessCount.set(key, 0);
  }

  get(key: string) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);
    }
    return value;
  }

  has(key: string) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.accessCount.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  private calculateHitRate() {
    const totalAccess = Array.from(this.accessCount.values()).reduce(
      (a, b) => a + b,
      0,
    );
    return totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0;
  }
}

export const componentCache = new ComponentCache();

// Hook para memoização otimizada
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  options?: { cache?: any; ttl?: number },
): T {
  const cache = options?.cache || componentCache;
  
  return useMemo(() => {
    const cacheKey = JSON.stringify(deps);
    
    // Verificar se tem cache
    if (cache && cache.has && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const result = factory();
    
    // Salvar no cache
    if (cache && cache.set) {
      cache.set(cacheKey, result);
    }
    
    // Se tem TTL, configurar timeout para limpar
    if (options?.ttl && cache && cache.delete) {
      setTimeout(() => {
        if (cache.delete) {
          cache.delete(cacheKey);
        }
      }, options.ttl);
    }

    return result;
  }, deps);
}

// Hook para callback otimizado com debounce
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options?: { cache?: any; debounceMs?: number },
): T {
  const cache = options?.cache;
  const debounceMs = options?.debounceMs || 0;
  
  const memoizedCallback = useCallback(callback, deps);

  return useMemo(() => {
    const cacheKey = JSON.stringify(deps);
    
    // Se tem cache personalizado, usar
    if (cache && cache.has && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    let result = memoizedCallback;
    if (debounceMs > 0) {
      result = debounce(memoizedCallback, debounceMs) as T;
    }
    
    // Salvar no cache se disponível
    if (cache && cache.set) {
      cache.set(cacheKey, result);
    }
    
    return result;
  }, [memoizedCallback, debounceMs, JSON.stringify(deps)]);
}

// HOC para memoização automática de componentes
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    displayName?: string;
    areEqual?: (prevProps: P, nextProps: P) => boolean;
    shouldCache?: boolean;
  } = {},
) {
  const { displayName, areEqual, shouldCache = true } = options;

  const MemoizedComponent = memo(Component, areEqual);

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

// Sistema de lazy loading inteligente
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense
        fallback={
          fallback || <div className="animate-pulse bg-muted h-20 rounded" />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Otimizador de listas grandes
export function optimizeListRendering<T>(
  items: T[],
  renderItem: (item: T, index: number) => React.ReactNode,
  options: {
    pageSize?: number;
    enableVirtualization?: boolean;
    itemHeight?: number;
  } = {},
) {
  const { pageSize = 50, enableVirtualization = false } = options;

  if (enableVirtualization && items.length > 100) {
    // Implementar virtualização para listas muito grandes
    return {
      type: "virtualized",
      items: items.slice(0, pageSize),
      hasMore: items.length > pageSize,
      renderItem,
    };
  }

  if (items.length > pageSize) {
    // Paginação simples para listas médias
    return {
      type: "paginated",
      items: items.slice(0, pageSize),
      hasMore: items.length > pageSize,
      renderItem,
    };
  }

  // Renderização normal para listas pequenas
  return {
    type: "normal",
    items,
    hasMore: false,
    renderItem,
  };
}

// Otimizador de cálculos financeiros
export class FinancialCalculationOptimizer {
  private calculationCache: any;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos
  private internalCache = new Map<string, { result: any; timestamp: number }>();

  constructor(
    options: { cache?: any; maxCacheSize?: number; cacheTTL?: number } = {},
  ) {
    this.calculationCache = options.cache || this.internalCache;
    if (options.cacheTTL) {
      this.cacheTimeout = options.cacheTTL;
    }
  }

  async optimizeCalculation<T>(
    key: string,
    calculation: (...args: any[]) => T | Promise<T>,
    dependencies: any[] = [],
  ): Promise<T> {
    const cacheKey = this.generateCacheKey(key, dependencies);

    // Verifica se tem método get (SmartCache) ou é Map nativo
    let cached;
    if (typeof this.calculationCache.get === "function") {
      if (
        this.calculationCache.has &&
        typeof this.calculationCache.has === "function"
      ) {
        // SmartCache
        cached = this.calculationCache.get(cacheKey);
      } else {
        // Map nativo
        const mapCached = this.calculationCache.get(cacheKey);
        if (mapCached && Date.now() - mapCached.timestamp < this.cacheTimeout) {
          cached = mapCached.result;
        }
      }
    }

    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const result = await calculation(dependencies);

    // Armazena no cache
    if (typeof this.calculationCache.set === "function") {
      if (
        this.calculationCache.has &&
        typeof this.calculationCache.has === "function"
      ) {
        // SmartCache
        this.calculationCache.set(cacheKey, result);
      } else {
        // Map nativo
        this.calculationCache.set(cacheKey, {
          result,
          timestamp: Date.now(),
        });
      }
    }

    return result;
  }

  private generateCacheKey(key: string, dependencies: any[]): string {
    const deps = Array.isArray(dependencies) ? dependencies : [];
    const depsHash = deps
      .map((dep) =>
        typeof dep === "object" ? JSON.stringify(dep) : String(dep),
      )
      .join("|");
    return `${key}:${depsHash}`;
  }

  clearCache() {
    if (typeof this.calculationCache.clear === "function") {
      this.calculationCache.clear();
    }
  }

  destroy() {
    this.clearCache();
    if (typeof this.calculationCache.destroy === "function") {
      this.calculationCache.destroy();
    }
  }

  getStats() {
    let cacheSize = 0;
    if (typeof this.calculationCache.size === "function") {
      cacheSize = this.calculationCache.size();
    } else if (typeof this.calculationCache.size === "number") {
      cacheSize = this.calculationCache.size;
    }

    return {
      cacheSize,
      cacheTimeout: this.cacheTimeout,
    };
  }
}

export const financialCalculationOptimizer =
  new FinancialCalculationOptimizer();

// Monitor de performance para componentes
export class ComponentPerformanceMonitor {
  private metrics = new Map<
    string,
    {
      renderCount: number;
      totalRenderTime: number;
      averageRenderTime: number;
      lastRenderTime: number;
      slowRenders: number;
    }
  >();

  startMeasure(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      this.recordMetric(componentName, renderTime);
    };
  }

  private recordMetric(componentName: string, renderTime: number) {
    const existing = this.metrics.get(componentName) || {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      slowRenders: 0,
    };

    existing.renderCount++;
    existing.totalRenderTime += renderTime;
    existing.averageRenderTime =
      existing.totalRenderTime / existing.renderCount;
    existing.lastRenderTime = renderTime;

    if (renderTime > 16) {
      // Mais de 16ms pode causar jank
      existing.slowRenders++;
    }

    this.metrics.set(componentName, existing);

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === "development" && renderTime > 50) {
      logComponents.warn(" ${componentName} render took ${renderTime.toFixed(2)}ms",  );
    }
  }

  getMetrics(componentName?: string) {
    if (componentName) {
      return this.metrics.get(componentName);
    }
    return Object.fromEntries(this.metrics);
  }

  getSlowComponents(threshold = 16) {
    return Array.from(this.metrics.entries())
      .filter(([, metrics]) => metrics.averageRenderTime > threshold)
      .sort(([, a], [, b]) => b.averageRenderTime - a.averageRenderTime);
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new ComponentPerformanceMonitor();

// Hook para monitoramento automático de performance
export function usePerformanceOptimization(componentName: string) {
  const measureRender = useCallback(() => {
    return performanceMonitor.startMeasure(componentName);
  }, [componentName]);

  return {
    measureRender,
    getMetrics: () => performanceMonitor.getMetrics(componentName),
  };
}

// Utilitários para otimização de imagens
export const imageOptimization = {
  // Lazy loading de imagens
  createLazyImage: (src: string, alt: string, className?: string) => {
    return {
      src,
      alt,
      className,
      loading: "lazy" as const,
      decoding: "async" as const,
    };
  },

  // Preload de imagens críticas
  preloadImage: (src: string) => {
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    }
  },
};

// Sistema de otimização automática
export class AutoPerformanceOptimizer {
  private isEnabled = process.env.NODE_ENV === "development";
  private optimizationRules = new Map<string, () => void>();

  enable() {
    this.isEnabled = true;
    this.startMonitoring();
  }

  disable() {
    this.isEnabled = false;
  }

  addRule(name: string, rule: () => void) {
    this.optimizationRules.set(name, rule);
  }

  private startMonitoring() {
    if (!this.isEnabled) return;

    setInterval(() => {
      this.checkPerformance();
    }, 10000); // Verificar a cada 10 segundos
  }

  private checkPerformance() {
    const slowComponents = performanceMonitor.getSlowComponents();

    if (slowComponents.length > 0) {
      console.group(
        "[Auto Performance Optimizer] Componentes lentos detectados:",
      );
      slowComponents.forEach(([name, metrics]) => {
        console.warn(
          `${name}: ${metrics.averageRenderTime.toFixed(2)}ms (${metrics.slowRenders} renders lentos)`,
        );
      });
      console.groupEnd();

      // Aplicar regras de otimização
      this.optimizationRules.forEach((rule, name) => {
        try {
          rule();
        } catch (error) {
          logComponents.error("Erro ao aplicar regra de otimização ${name}:", error);
        }
      });
    }
  }

  getReport() {
    return {
      componentMetrics: performanceMonitor.getMetrics(),
      cacheStats: componentCache.getStats(),
      calculationStats: financialCalculationOptimizer.getStats(),
      slowComponents: performanceMonitor.getSlowComponents(),
    };
  }
}

export const autoOptimizer = new AutoPerformanceOptimizer();

// Inicializar otimizador automático em desenvolvimento
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  autoOptimizer.enable();

  // Adicionar regras de otimização automática
  autoOptimizer.addRule("clearCaches", () => {
    componentCache.clear();
    financialCalculationOptimizer.clearCache();
  });

  // Expor no window para debug
  (window as any).performanceOptimizer = {
    componentCache,
    financialCalculationOptimizer,
    performanceMonitor,
    autoOptimizer,
  };
}
