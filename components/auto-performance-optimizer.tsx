"use client";

import React, { useEffect, useState, useCallback } from "react";
import { logComponents } from "../lib/logger";
import { performanceMonitor } from "../lib/performance-monitor";
import { dataCache, apiCache } from "../lib/smart-cache";
import { toast } from "sonner";

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
  enablePreloading: boolean;
  enableBundleSplitting: boolean;
  performanceThreshold: number;
}

interface PerformanceIssue {
  type: "critical" | "warning" | "info";
  message: string;
  suggestion: string;
  autoFixAvailable: boolean;
}

const AutoPerformanceOptimizer: React.FC<{
  children: React.ReactNode;
  settings?: Partial<OptimizationSettings>;
  showNotifications?: boolean;
}> = ({ children, settings = {}, showNotifications = true }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [optimizationSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableImageOptimization: true,
    enableCaching: true,
    enablePreloading: true,
    enableBundleSplitting: true,
    performanceThreshold: 100, // ms
    ...settings,
  });

  // Monitor performance and detect issues
  const detectPerformanceIssues = useCallback(() => {
    const report = performanceMonitor.getPerformanceReport();
    const newIssues: PerformanceIssue[] = [];

    // Check for critical render times
    if (report.slowestComponents.length > 0) {
      const slowestComponent = report.slowestComponents[0];
      if (slowestComponent.renderTime > 100) {
        newIssues.push({
          type: "critical",
          message: `Componente ${slowestComponent.componentName} está renderizando em ${slowestComponent.renderTime.toFixed(1)}ms`,
          suggestion:
            "Considere usar React.memo() ou otimizar a lógica de renderização",
          autoFixAvailable: false,
        });
      }
    }

    // Check for slow network requests
    if (report.slowestNetworkRequests.length > 0) {
      const slowestRequest = report.slowestNetworkRequests[0];
      if (slowestRequest.duration > 2000) {
        newIssues.push({
          type: "warning",
          message: `Requisição para ${slowestRequest.url} está levando ${(slowestRequest.duration / 1000).toFixed(1)}s`,
          suggestion: "Considere implementar cache ou otimizar a API",
          autoFixAvailable: true,
        });
      }
    }

    // Check for memory usage
    const cacheStats = dataCache.getStats();
    if (cacheStats.memoryUsage > 5 * 1024 * 1024) {
      // 5MB
      newIssues.push({
        type: "warning",
        message: `Cache usando ${(cacheStats.memoryUsage / 1024 / 1024).toFixed(1)}MB de memória`,
        suggestion: "Cache será otimizado automaticamente",
        autoFixAvailable: true,
      });
    }

    // Check for frequent re-renders
    const frequentComponents = report.slowestComponents.filter(
      (c) => c.renderCount > 10,
    );
    if (frequentComponents.length > 0) {
      newIssues.push({
        type: "info",
        message: `${frequentComponents.length} componentes com re-renderizações frequentes`,
        suggestion: "Considere usar useCallback e useMemo para otimizar",
        autoFixAvailable: false,
      });
    }

    setIssues(newIssues);
    return newIssues;
  }, []);

  // Auto-fix performance issues
  const autoFixIssues = useCallback(async () => {
    setIsOptimizing(true);

    try {
      // Optimize caches
      if (optimizationSettings.enableCaching) {
        dataCache.optimize();
        apiCache.optimize();
      }

      // Preload critical resources
      if (optimizationSettings.enablePreloading) {
        await preloadCriticalResources();
      }

      // Clean up memory
      if (typeof window !== "undefined" && "gc" in window) {
        // @ts-ignore
        window.gc();
      }

      if (showNotifications) {
        toast.success("Otimizações automáticas aplicadas com sucesso!");
      }
    } catch (error) {
      logComponents.error("Erro durante otimização automática:", error);
      if (showNotifications) {
        toast.error("Erro durante otimização automática");
      }
    } finally {
      setIsOptimizing(false);
    }
  }, [optimizationSettings, showNotifications]);

  // Preload critical resources
  const preloadCriticalResources = useCallback(async () => {
    const criticalUrls = [
      "/api/test/accounts/mock",
      "/api/test/transactions/mock",
      "/api/test/goals/mock",
      "/api/test/dashboard/mock",
    ];

    const preloadPromises = criticalUrls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          cache: "force-cache",
        });
        return response.ok;
      } catch {
        return false;
      }
    });

    await Promise.allSettled(preloadPromises);
  }, []);

  // Optimize images in the DOM
  const optimizeImages = useCallback(() => {
    if (!optimizationSettings.enableImageOptimization) return;
    if (typeof document === "undefined") return;

    const images = document.querySelectorAll("img[src]");
    images.forEach((img) => {
      const imgElement = img as HTMLImageElement;

      // Add lazy loading if not present
      if (!imgElement.loading) {
        imgElement.loading = "lazy";
      }

      // Add decoding optimization
      if (!imgElement.decoding) {
        imgElement.decoding = "async";
      }

      // Add intersection observer for better lazy loading
      if (optimizationSettings.enableLazyLoading) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const img = entry.target as HTMLImageElement;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute("data-src");
                }
                observer.unobserve(img);
              }
            });
          },
          { threshold: 0.1 },
        );

        observer.observe(imgElement);
      }
    });
  }, [optimizationSettings]);

  // Monitor and optimize periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const issues = detectPerformanceIssues();

      // Auto-fix if there are critical issues
      const criticalIssues = issues.filter(
        (i) => i.type === "critical" && i.autoFixAvailable,
      );
      if (criticalIssues.length > 0 && !isOptimizing) {
        autoFixIssues();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [detectPerformanceIssues, autoFixIssues, isOptimizing]);

  // Initial optimization
  useEffect(() => {
    const timer = setTimeout(() => {
      optimizeImages();
      detectPerformanceIssues();
    }, 1000); // Wait for initial render

    return () => clearTimeout(timer);
  }, [optimizeImages, detectPerformanceIssues]);

  // Performance observer for real-time monitoring
  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.duration > optimizationSettings.performanceThreshold) {
          performanceMonitor.trackCustomMetric(
            `Slow Operation: ${entry.name}`,
            entry.duration,
            "computation",
          );

          if (showNotifications && entry.duration > 500) {
            toast.warning(
              `Operação lenta detectada: ${entry.name} (${entry.duration.toFixed(1)}ms)`,
              { duration: 3000 },
            );
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ["measure", "navigation"] });
    } catch (error) {
      console.warn("Performance Observer não suportado:", error);
    }

    return () => observer.disconnect();
  }, [optimizationSettings.performanceThreshold, showNotifications]);

  // Memory pressure handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMemoryPressure = () => {
      console.log("Pressão de memória detectada, otimizando...");
      dataCache.optimize();
      apiCache.optimize();

      if (showNotifications) {
        toast.info("Otimizando memória devido à pressão do sistema");
      }
    };

    // Listen for memory pressure events (if supported)
    if ("memory" in navigator) {
      // @ts-ignore
      const memoryInfo = navigator.memory;
      if (
        memoryInfo &&
        memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8
      ) {
        handleMemoryPressure();
      }
    }

    // Fallback: monitor memory usage periodically
    const memoryInterval = setInterval(() => {
      if ("memory" in navigator) {
        // @ts-ignore
        const memoryInfo = navigator.memory;
        if (
          memoryInfo &&
          memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8
        ) {
          handleMemoryPressure();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(memoryInterval);
  }, [showNotifications]);

  return (
    <>
      {children}

      {/* Performance Issues Indicator */}
      {issues.length > 0 && showNotifications && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {issues.length} problema{issues.length > 1 ? "s" : ""} de
                performance
              </span>
              <button
                onClick={autoFixIssues}
                disabled={isOptimizing}
                className="ml-2 text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded disabled:opacity-50"
              >
                {isOptimizing ? "Otimizando..." : "Corrigir"}
              </button>
            </div>
            <div className="mt-1 text-xs">{issues[0]?.message}</div>
          </div>
        </div>
      )}
    </>
  );
};

// HOC for automatic performance optimization
export function withAutoOptimization<P extends object>(
  Component: React.ComponentType<P>,
  settings?: Partial<OptimizationSettings>,
) {
  const OptimizedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <AutoPerformanceOptimizer settings={settings}>
        <Component {...props} ref={ref} />
      </AutoPerformanceOptimizer>
    );
  });

  OptimizedComponent.displayName = `withAutoOptimization(${Component.displayName || Component.name})`;
  return OptimizedComponent;
}

// Hook for manual optimization control
export function usePerformanceOptimization() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimize = useCallback(async () => {
    setIsOptimizing(true);

    try {
      // Clear expired cache entries
      dataCache.optimize();
      apiCache.optimize();

      // Force garbage collection if available
      if (typeof window !== "undefined" && "gc" in window) {
        // @ts-ignore
        window.gc();
      }

      // Clear performance metrics older than 10 minutes
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      const metrics = performanceMonitor.getMetrics();
      const recentMetrics = metrics.filter((m) => m.timestamp > tenMinutesAgo);

      if (recentMetrics.length < metrics.length) {
        performanceMonitor.clearMetrics();
      }

      return true;
    } catch (error) {
      logComponents.error("Erro durante otimização:", error);
      return false;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const getPerformanceScore = useCallback(() => {
    const report = performanceMonitor.getPerformanceReport();
    const totalIssues =
      report.summary.criticalIssues +
      report.summary.highIssues +
      report.summary.mediumIssues;
    return Math.max(
      0,
      100 -
        (report.summary.criticalIssues * 25 +
          report.summary.highIssues * 10 +
          report.summary.mediumIssues * 5),
    );
  }, []);

  return {
    optimize,
    isOptimizing,
    getPerformanceScore,
  };
}

export default AutoPerformanceOptimizer;
export type { OptimizationSettings, PerformanceIssue };
