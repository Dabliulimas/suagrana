"use client";

import { requestThrottler } from "./request-throttler";

import { logComponents } from "../logger";
interface PerformanceIssue {
  type: "memory" | "render" | "network" | "fps" | "leak";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  autoFixAvailable: boolean;
  timestamp: number;
}

interface AutoFixAction {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

class AutoPerformanceFixer {
  private issues: PerformanceIssue[] = [];
  private fixHistory: {
    issue: PerformanceIssue;
    action: AutoFixAction;
    success: boolean;
    timestamp: number;
  }[] = [];
  private isRunning = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private observers: PerformanceObserver[] = [];

  constructor() {
    // Só inicializar no browser
    if (typeof window !== "undefined") {
      this.setupPerformanceObservers();
      this.startMonitoring();
    }
  }

  private setupPerformanceObservers() {
    if (typeof window === "undefined") return;

    try {
      // Observer para Long Tasks (tarefas > 50ms)
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.reportIssue({
              type: "render",
              severity: entry.duration > 100 ? "high" : "medium",
              description: `Tarefa longa detectada: ${entry.duration.toFixed(1)}ms`,
              autoFixAvailable: true,
              timestamp: Date.now(),
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });
      this.observers.push(longTaskObserver);

      // Observer para Layout Shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).value > 0.1) {
            this.reportIssue({
              type: "render",
              severity: "medium",
              description: `Layout shift detectado: ${(entry as any).value.toFixed(3)}`,
              autoFixAvailable: false,
              timestamp: Date.now(),
            });
          }
        }
      });

      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(layoutShiftObserver);
    } catch (error) {
      console.warn("Performance observers não suportados:", error);
    }
  }

  private startMonitoring() {
    // Só executar no browser
    if (typeof window === "undefined") return;

    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.checkNetworkPerformance();
      this.checkFPS();
      this.autoFixIssues();
    }, 5000); // Check a cada 5 segundos
  }

  private checkMemoryUsage() {
    if (typeof window === "undefined") return;

    // @ts-ignore - performance.memory pode não estar disponível em todos os browsers
    const memory = (performance as any).memory;
    if (!memory) return;

    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    const usagePercent = (usedMB / limitMB) * 100;

    if (usagePercent > 80) {
      this.reportIssue({
        type: "memory",
        severity: usagePercent > 90 ? "critical" : "high",
        description: `Alto uso de memória: ${usedMB.toFixed(1)}MB (${usagePercent.toFixed(1)}%)`,
        autoFixAvailable: true,
        timestamp: Date.now(),
      });
    }

    // Detectar possível vazamento
    const memoryGrowth = this.calculateMemoryGrowth();
    if (memoryGrowth > 10) {
      // Crescimento > 10MB/min
      this.reportIssue({
        type: "leak",
        severity: "high",
        description: `Possível vazamento: crescimento de ${memoryGrowth.toFixed(1)}MB/min`,
        autoFixAvailable: true,
        timestamp: Date.now(),
      });
    }
  }

  private calculateMemoryGrowth(): number {
    // Implementação simplificada - em produção seria mais sofisticada
    const now = Date.now();
    const recentIssues = this.issues.filter(
      (issue) => issue.type === "memory" && now - issue.timestamp < 60000,
    );
    return recentIssues.length * 2; // Estimativa simples
  }

  private checkNetworkPerformance() {
    const stats = requestThrottler.getStats();

    if (stats.pending > 15) {
      this.reportIssue({
        type: "network",
        severity: stats.pending > 25 ? "high" : "medium",
        description: `Muitas requisições pendentes: ${stats.pending}`,
        autoFixAvailable: true,
        timestamp: Date.now(),
      });
    }

    if (stats.failed > 5) {
      this.reportIssue({
        type: "network",
        severity: "medium",
        description: `Muitas requisições falharam: ${stats.failed}`,
        autoFixAvailable: true,
        timestamp: Date.now(),
      });
    }
  }

  private checkFPS() {
    // Só executar no browser
    if (
      typeof window === "undefined" ||
      typeof requestAnimationFrame === "undefined"
    ) {
      return;
    }

    // Implementação simplificada de detecção de FPS baixo
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));

        if (fps < 30) {
          this.reportIssue({
            type: "fps",
            severity: fps < 15 ? "high" : "medium",
            description: `FPS baixo detectado: ${fps}`,
            autoFixAvailable: true,
            timestamp: Date.now(),
          });
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }

  private reportIssue(issue: PerformanceIssue) {
    // Evitar duplicatas recentes
    const recentSimilar = this.issues.find(
      (existing) =>
        existing.type === issue.type &&
        existing.severity === issue.severity &&
        Date.now() - existing.timestamp < 10000, // 10 segundos
    );

    if (!recentSimilar) {
      this.issues.push(issue);
      console.warn("🚨 Performance Issue:", issue);
    }
  }

  private async autoFixIssues() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const criticalIssues = this.issues.filter(
        (issue) => issue.severity === "critical" && issue.autoFixAvailable,
      );

      const highIssues = this.issues.filter(
        (issue) => issue.severity === "high" && issue.autoFixAvailable,
      );

      // Corrigir issues críticos primeiro
      for (const issue of criticalIssues) {
        await this.applyAutoFix(issue);
      }

      // Depois issues de alta prioridade (máximo 2 por ciclo)
      for (const issue of highIssues.slice(0, 2)) {
        await this.applyAutoFix(issue);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async applyAutoFix(issue: PerformanceIssue): Promise<boolean> {
    const action = this.getAutoFixAction(issue);
    if (!action) return false;

    try {
      console.log(`🔧 Aplicando correção automática: ${action.name}`);
      const success = await action.execute();

      this.fixHistory.push({
        issue,
        action,
        success,
        timestamp: Date.now(),
      });

      if (success) {
        // Remover issue da lista
        this.issues = this.issues.filter((i) => i !== issue);
        console.log(`✅ Correção aplicada com sucesso: ${action.name}`);
      }

      return success;
    } catch (error) {
      logComponents.error("❌ Erro ao aplicar correção: ${action.name}", error);
      return false;
    }
  }

  private getAutoFixAction(issue: PerformanceIssue): AutoFixAction | null {
    switch (issue.type) {
      case "memory":
        return {
          name: "Limpeza de Memória",
          description: "Força garbage collection e limpa caches",
          execute: async () => {
            // Limpar caches
            if (typeof window !== "undefined") {
              const cache = (window as any).__requestCache;
              if (cache) cache.clear();

              // Limpar event listeners órfãos
              const events = (window as any).__eventListeners || [];
              events.forEach((cleanup: () => void) => {
                try {
                  cleanup();
                } catch (e) {}
              });
              (window as any).__eventListeners = [];
            }

            // Forçar garbage collection se disponível
            if ((window as any).gc) {
              (window as any).gc();
            }

            return true;
          },
        };

      case "network":
        return {
          name: "Otimização de Rede",
          description: "Reduz limite de requisições concorrentes",
          execute: async () => {
            requestThrottler.setMaxConcurrent(2);
            requestThrottler.setRequestsPerSecond(3);

            // Restaurar após 30 segundos
            setTimeout(() => {
              requestThrottler.setMaxConcurrent(3);
              requestThrottler.setRequestsPerSecond(5);
            }, 30000);

            return true;
          },
        };

      case "render":
        return {
          name: "Otimização de Renderização",
          description: "Reduz frequência de atualizações",
          execute: async () => {
            // Implementar throttling de re-renders
            const style = document.createElement("style");
            style.textContent = `
              * {
                will-change: auto !important;
              }
              .performance-optimized {
                contain: layout style paint;
              }
            `;
            document.head.appendChild(style);

            // Remover após 1 minuto
            setTimeout(() => {
              document.head.removeChild(style);
            }, 60000);

            return true;
          },
        };

      case "fps":
        return {
          name: "Otimização de FPS",
          description: "Reduz animações e efeitos visuais",
          execute: async () => {
            const style = document.createElement("style");
            style.textContent = `
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-delay: 0.01ms !important;
                transition-duration: 0.01ms !important;
                transition-delay: 0.01ms !important;
              }
            `;
            document.head.appendChild(style);

            // Restaurar após 2 minutos
            setTimeout(() => {
              document.head.removeChild(style);
            }, 120000);

            return true;
          },
        };

      case "leak":
        return {
          name: "Correção de Vazamento",
          description: "Limpa referências e força garbage collection",
          execute: async () => {
            // Limpeza agressiva
            if (typeof window !== "undefined") {
              // Limpar todos os caches
              ["__requestCache", "__componentCache", "__routeCache"].forEach(
                (cache) => {
                  if ((window as any)[cache]) {
                    (window as any)[cache].clear();
                  }
                },
              );

              // Limpar timers órfãos
              const highestTimeoutId = setTimeout(() => {}, 0);
              for (let i = 0; i < highestTimeoutId; i++) {
                clearTimeout(i);
              }
            }

            return true;
          },
        };

      default:
        return null;
    }
  }

  // API pública
  getIssues(): PerformanceIssue[] {
    return [...this.issues];
  }

  getFixHistory() {
    return [...this.fixHistory];
  }

  clearIssues() {
    this.issues = [];
  }

  forceCheck() {
    this.checkMemoryUsage();
    this.checkNetworkPerformance();
    this.checkFPS();
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.observers.forEach((observer) => {
      observer.disconnect();
    });

    this.issues = [];
    this.fixHistory = [];
  }
}

// Instância global - só criar no browser
export const autoPerformanceFixer =
  typeof window !== "undefined" ? new AutoPerformanceFixer() : null;

// Hook para React
export function useAutoPerformanceFixer() {
  const [issues, setIssues] = React.useState<PerformanceIssue[]>([]);
  const [fixHistory, setFixHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Só executar no browser
    if (typeof window === "undefined") return;

    const updateStats = () => {
      if (autoPerformanceFixer) {
        setIssues(autoPerformanceFixer.getIssues());
        setFixHistory(autoPerformanceFixer.getFixHistory());
      }
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => clearInterval(interval);
  }, []);

  const forceCheck = React.useCallback(() => {
    if (autoPerformanceFixer) {
      autoPerformanceFixer.forceCheck();
    }
  }, []);

  const clearIssues = React.useCallback(() => {
    if (autoPerformanceFixer) {
      autoPerformanceFixer.clearIssues();
    }
  }, []);

  return {
    issues,
    fixHistory,
    forceCheck,
    clearIssues,
  };
}

export default autoPerformanceFixer;
