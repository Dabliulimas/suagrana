// Sistema de monitoramento de performance de build

interface PerformanceMetrics {
  buildTime: number;
  bundleSize: number;
  chunkSizes: Record<string, number>;
  compilationTime: number;
  hotReloadTime: number;
  memoryUsage: number;
  timestamp: string;
}

interface BuildEvent {
  type:
    | "build-start"
    | "build-end"
    | "hot-reload"
    | "compilation-start"
    | "compilation-end";
  timestamp: number;
  data?: any;
}

class PerformanceMonitor {
  private events: BuildEvent[] = [];
  private metrics: PerformanceMetrics[] = [];
  private buildStartTime: number = 0;
  private compilationStartTime: number = 0;

  // Iniciar monitoramento de build
  startBuild() {
    this.buildStartTime = Date.now();
    this.addEvent("build-start");
    console.log("🏗️  Build started...");
  }

  // Finalizar monitoramento de build
  endBuild(bundleSize?: number, chunkSizes?: Record<string, number>) {
    const buildTime = Date.now() - this.buildStartTime;
    this.addEvent("build-end", { buildTime, bundleSize, chunkSizes });

    const metrics: PerformanceMetrics = {
      buildTime,
      bundleSize: bundleSize || 0,
      chunkSizes: chunkSizes || {},
      compilationTime: 0,
      hotReloadTime: 0,
      memoryUsage: this.getMemoryUsage(),
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metrics);
    this.logBuildMetrics(metrics);

    return metrics;
  }

  // Monitorar hot reload
  measureHotReload(callback: () => void) {
    const start = Date.now();
    this.addEvent("hot-reload");

    callback();

    const hotReloadTime = Date.now() - start;
    console.log(`🔥 Hot reload: ${hotReloadTime}ms`);

    return hotReloadTime;
  }

  // Monitorar compilação TypeScript
  startCompilation() {
    this.compilationStartTime = Date.now();
    this.addEvent("compilation-start");
  }

  endCompilation() {
    const compilationTime = Date.now() - this.compilationStartTime;
    this.addEvent("compilation-end", { compilationTime });
    console.log(`📝 TypeScript compilation: ${compilationTime}ms`);

    return compilationTime;
  }

  // Adicionar evento
  private addEvent(type: BuildEvent["type"], data?: any) {
    this.events.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }

  // Obter uso de memória
  private getMemoryUsage(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  // Log das métricas de build
  private logBuildMetrics(metrics: PerformanceMetrics) {
    console.log("\n📊 Build Performance Metrics:");
    console.log(
      `   Build Time: ${metrics.buildTime}ms (${(metrics.buildTime / 1000).toFixed(2)}s)`,
    );

    if (metrics.bundleSize > 0) {
      console.log(`   Bundle Size: ${this.formatBytes(metrics.bundleSize)}`);
    }

    if (Object.keys(metrics.chunkSizes).length > 0) {
      console.log("   Chunk Sizes:");
      Object.entries(metrics.chunkSizes).forEach(([name, size]) => {
        console.log(`     ${name}: ${this.formatBytes(size)}`);
      });
    }

    if (metrics.memoryUsage > 0) {
      console.log(`   Memory Usage: ${this.formatBytes(metrics.memoryUsage)}`);
    }

    // Alertas de performance
    this.checkPerformanceAlerts(metrics);
  }

  // Verificar alertas de performance
  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    const alerts: string[] = [];

    if (metrics.buildTime > 30000) {
      alerts.push("⚠️  Build time is very slow (>30s)");
    } else if (metrics.buildTime > 15000) {
      alerts.push("⚠️  Build time is slow (>15s)");
    }

    if (metrics.bundleSize > 5 * 1024 * 1024) {
      alerts.push("⚠️  Bundle size is very large (>5MB)");
    } else if (metrics.bundleSize > 2 * 1024 * 1024) {
      alerts.push("⚠️  Bundle size is large (>2MB)");
    }

    if (metrics.hotReloadTime > 5000) {
      alerts.push("⚠️  Hot reload is slow (>5s)");
    }

    if (alerts.length > 0) {
      console.log("\n🚨 Performance Alerts:");
      alerts.forEach((alert) => console.log(`   ${alert}`));
    }
  }

  // Formatar bytes
  private formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Obter histórico de métricas
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Obter estatísticas
  getStatistics() {
    if (this.metrics.length === 0) {
      return null;
    }

    const buildTimes = this.metrics.map((m) => m.buildTime);
    const bundleSizes = this.metrics
      .map((m) => m.bundleSize)
      .filter((s) => s > 0);

    return {
      buildTime: {
        average: buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length,
        min: Math.min(...buildTimes),
        max: Math.max(...buildTimes),
        latest: buildTimes[buildTimes.length - 1],
      },
      bundleSize:
        bundleSizes.length > 0
          ? {
              average:
                bundleSizes.reduce((a, b) => a + b, 0) / bundleSizes.length,
              min: Math.min(...bundleSizes),
              max: Math.max(...bundleSizes),
              latest: bundleSizes[bundleSizes.length - 1],
            }
          : null,
      totalBuilds: this.metrics.length,
    };
  }

  // Salvar relatório
  saveReport(filename: string = "performance-report.json") {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      events: this.events,
      statistics: this.getStatistics(),
    };

    if (typeof require !== "undefined") {
      const fs = require("fs");
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Performance report saved to: ${filename}`);
    }

    return report;
  }

  // Limpar dados antigos
  clearOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
    // 7 dias
    const cutoff = Date.now() - maxAge;

    this.metrics = this.metrics.filter(
      (m) => new Date(m.timestamp).getTime() > cutoff,
    );

    this.events = this.events.filter((e) => e.timestamp > cutoff);
  }
}

// Instância global do monitor
export const performanceMonitor = new PerformanceMonitor();

// Hook para monitorar performance de componentes
export function usePerformanceMonitor(componentName: string) {
  const [renderTime, setRenderTime] = useState<number>(0);

  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      const duration = end - start;
      setRenderTime(duration);

      if (duration > 100) {
        console.warn(
          `⚠️  Slow component render: ${componentName} took ${duration.toFixed(2)}ms`,
        );
      }
    };
  }, [componentName]);

  return { renderTime };
}

// Decorator para monitorar funções
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name?: string,
): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;

    console.log(`⏱️  ${name || fn.name}: ${duration.toFixed(2)}ms`);

    return result;
  }) as T;
}

import { useState, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
