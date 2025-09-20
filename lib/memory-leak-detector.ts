"use client";

import React from "react";
import { logComponents } from "../logger";
import { performanceMonitor } from "./performance-monitor";

interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  componentCount: number;
  eventListeners: number;
}

interface MemoryLeak {
  type: "memory_growth" | "component_leak" | "listener_leak" | "cache_overflow";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestion: string;
  autoFixAvailable: boolean;
}

class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 50;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private componentRegistry = new Set<string>();
  private eventListenerCount = 0;
  private isMonitoring = false;

  constructor() {
    this.startMonitoring();
  }

  startMonitoring() {
    if (this.isMonitoring || typeof window === "undefined") return;

    this.isMonitoring = true;

    // Monitorar a cada 10 segundos
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
      this.analyzeMemoryTrends();
    }, 10000);

    // Monitorar event listeners
    this.monitorEventListeners();
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  private takeSnapshot(): MemorySnapshot | null {
    if (typeof window === "undefined" || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      componentCount: this.componentRegistry.size,
      eventListeners: this.eventListenerCount,
    };

    this.snapshots.push(snapshot);

    // Manter apenas os últimos snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  private analyzeMemoryTrends(): MemoryLeak[] {
    if (this.snapshots.length < 5) return [];

    const leaks: MemoryLeak[] = [];
    const recent = this.snapshots.slice(-5);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    // Detectar crescimento constante de memória
    const memoryGrowth = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const timeSpan = newest.timestamp - oldest.timestamp;
    const growthRate = (memoryGrowth / timeSpan) * 1000; // bytes per second

    if (growthRate > 1024 * 100) {
      // 100KB/s
      leaks.push({
        type: "memory_growth",
        severity: growthRate > 1024 * 500 ? "critical" : "high",
        description: `Crescimento de memória detectado: ${(growthRate / 1024).toFixed(1)}KB/s`,
        suggestion:
          "Verificar vazamentos de memória em componentes e event listeners",
        autoFixAvailable: false,
      });
    }

    // Detectar vazamento de componentes
    const componentGrowth = newest.componentCount - oldest.componentCount;
    if (componentGrowth > 10) {
      leaks.push({
        type: "component_leak",
        severity: componentGrowth > 50 ? "high" : "medium",
        description: `${componentGrowth} componentes não foram desmontados`,
        suggestion: "Verificar cleanup em useEffect e componentWillUnmount",
        autoFixAvailable: true,
      });
    }

    // Detectar vazamento de event listeners
    const listenerGrowth = newest.eventListeners - oldest.eventListeners;
    if (listenerGrowth > 20) {
      leaks.push({
        type: "listener_leak",
        severity: listenerGrowth > 100 ? "high" : "medium",
        description: `${listenerGrowth} event listeners não foram removidos`,
        suggestion: "Adicionar cleanup de event listeners em useEffect",
        autoFixAvailable: true,
      });
    }

    // Detectar uso excessivo de memória
    const memoryUsageMB = newest.usedJSHeapSize / (1024 * 1024);
    if (memoryUsageMB > 100) {
      leaks.push({
        type: "cache_overflow",
        severity: memoryUsageMB > 200 ? "critical" : "high",
        description: `Uso alto de memória: ${memoryUsageMB.toFixed(1)}MB`,
        suggestion: "Limpar caches e otimizar estruturas de dados",
        autoFixAvailable: true,
      });
    }

    if (leaks.length > 0) {
      this.reportLeaks(leaks);
    }

    return leaks;
  }

  private monitorEventListeners() {
    if (typeof window === "undefined") return;

    // Interceptar addEventListener
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const originalRemoveEventListener =
      EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      memoryLeakDetector.eventListenerCount++;
      return originalAddEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      memoryLeakDetector.eventListenerCount--;
      return originalRemoveEventListener.call(this, type, listener, options);
    };
  }

  private reportLeaks(leaks: MemoryLeak[]) {
    leaks.forEach((leak) => {
      logComponents.warn(" ${leak.type}:", leak.description);

      performanceMonitor.trackCustomMetric(
        `Memory Leak: ${leak.type}`,
        1,
        "memory",
      );

      // Auto-fix se disponível
      if (leak.autoFixAvailable) {
        this.attemptAutoFix(leak);
      }
    });
  }

  private attemptAutoFix(leak: MemoryLeak) {
    switch (leak.type) {
      case "cache_overflow":
        this.clearCaches();
        break;
      case "component_leak":
        this.forceGarbageCollection();
        break;
      case "listener_leak":
        console.warn("Event listener leak detected - manual cleanup required");
        break;
    }
  }

  private clearCaches() {
    // Limpar caches globais
    if (typeof window !== "undefined") {
      // Limpar cache do navegador se possível
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            if (name.includes("temp") || name.includes("cache")) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }

  private forceGarbageCollection() {
    // Forçar garbage collection se disponível (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development" && (window as any).gc) {
      (window as any).gc();
    }
  }

  // Métodos públicos para registro de componentes
  registerComponent(componentName: string) {
    this.componentRegistry.add(componentName);
  }

  unregisterComponent(componentName: string) {
    this.componentRegistry.delete(componentName);
  }

  getMemoryStats() {
    const latest = this.snapshots[this.snapshots.length - 1];
    if (!latest) return null;

    return {
      usedMemoryMB: (latest.usedJSHeapSize / (1024 * 1024)).toFixed(1),
      totalMemoryMB: (latest.totalJSHeapSize / (1024 * 1024)).toFixed(1),
      memoryLimitMB: (latest.jsHeapSizeLimit / (1024 * 1024)).toFixed(1),
      componentCount: latest.componentCount,
      eventListeners: latest.eventListeners,
      memoryUsagePercent: (
        (latest.usedJSHeapSize / latest.jsHeapSizeLimit) *
        100
      ).toFixed(1),
    };
  }

  getMemoryTrend() {
    if (this.snapshots.length < 2) return "stable";

    const recent = this.snapshots.slice(-10);
    const growth =
      recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;

    if (growth > 1024 * 1024 * 5) return "increasing"; // 5MB growth
    if (growth < -1024 * 1024) return "decreasing"; // 1MB decrease
    return "stable";
  }

  cleanup() {
    this.stopMonitoring();
    this.snapshots = [];
    this.componentRegistry.clear();
  }
}

// Instância global
export const memoryLeakDetector = new MemoryLeakDetector();

// Hook para monitoramento de componentes
export function useMemoryMonitoring(componentName: string) {
  React.useEffect(() => {
    memoryLeakDetector.registerComponent(componentName);

    return () => {
      memoryLeakDetector.unregisterComponent(componentName);
    };
  }, [componentName]);

  return {
    getMemoryStats: () => memoryLeakDetector.getMemoryStats(),
    getMemoryTrend: () => memoryLeakDetector.getMemoryTrend(),
  };
}

// Hook para cleanup automático
export function useAutoCleanup(
  cleanupFn: () => void,
  deps: React.DependencyList = [],
) {
  React.useEffect(() => {
    return cleanupFn;
  }, deps);
}

export default memoryLeakDetector;
