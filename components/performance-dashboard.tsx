"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { logComponents } from "../lib/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Activity,
  Clock,
  Zap,
  Database,
  Wifi,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  performanceMonitor,
  PerformanceMetric,
  ComponentMetric,
  NetworkMetric,
  StorageMetric,
} from "../lib/performance-monitor";
import { useSafeTheme } from "../hooks/use-safe-theme";
import {
  useOptimizedMemo,
  useOptimizedCallback,
  withPerformanceOptimization,
  financialCalculationOptimizer,
} from "../lib/performance-optimizer";

interface PerformanceReport {
  summary: {
    totalMetrics: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  categories: Record<string, number>;
  slowestComponents: ComponentMetric[];
  slowestNetworkRequests: NetworkMetric[];
  slowestStorageOperations: StorageMetric[];
  recommendations: string[];
}

const PerformanceDashboard = memo(function PerformanceDashboard() {
  const { theme } = useSafeTheme();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Carregamento otimizado de métricas
  const loadMetrics = useOptimizedCallback(async () => {
    try {
      setIsLoading(true);
      const allMetrics = performanceMonitor.getAllMetrics();
      setMetrics(allMetrics);

      // Gerar relatório usando otimizador
      const optimizedReport =
        await financialCalculationOptimizer.optimizeCalculation(
          "performance-report",
          () => generateReport(allMetrics),
          [allMetrics.length],
        );

      setReport(optimizedReport);
    } catch (error) {
      logComponents.error("Erro ao carregar métricas de performance:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Geração otimizada de relatório
  const generateReport = useOptimizedCallback(
    (metrics: PerformanceMetric[]): PerformanceReport => {
      const summary = {
        totalMetrics: metrics.length,
        criticalIssues: metrics.filter((m) => m.severity === "critical").length,
        highIssues: metrics.filter((m) => m.severity === "high").length,
        mediumIssues: metrics.filter((m) => m.severity === "medium").length,
        lowIssues: metrics.filter((m) => m.severity === "low").length,
      };

      const categories = metrics.reduce(
        (acc, metric) => {
          acc[metric.category] = (acc[metric.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const componentMetrics = metrics.filter(
        (m) => m.category === "component",
      ) as ComponentMetric[];
      const networkMetrics = metrics.filter(
        (m) => m.category === "network",
      ) as NetworkMetric[];
      const storageMetrics = metrics.filter(
        (m) => m.category === "storage",
      ) as StorageMetric[];

      const slowestComponents = componentMetrics
        .sort((a, b) => b.renderTime - a.renderTime)
        .slice(0, 5);

      const slowestNetworkRequests = networkMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

      const slowestStorageOperations = storageMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

      const recommendations = generateRecommendations(metrics);

      return {
        summary,
        categories,
        slowestComponents,
        slowestNetworkRequests,
        slowestStorageOperations,
        recommendations,
      };
    },
    [],
  );

  // Geração de recomendações
  const generateRecommendations = useOptimizedCallback(
    (metrics: PerformanceMetric[]): string[] => {
      const recommendations = [];
      const componentMetrics = metrics.filter(
        (m) => m.category === "component",
      ) as ComponentMetric[];
      const networkMetrics = metrics.filter(
        (m) => m.category === "network",
      ) as NetworkMetric[];

      // Componentes lentos
      const slowComponents = componentMetrics.filter((m) => m.renderTime > 100);
      if (slowComponents.length > 0) {
        recommendations.push(
          `Otimizar ${slowComponents.length} componente(s) com renderização lenta (>100ms)`,
        );
      }

      // Requests lentos
      const slowRequests = networkMetrics.filter((m) => m.duration > 2000);
      if (slowRequests.length > 0) {
        recommendations.push(
          `Otimizar ${slowRequests.length} requisição(ões) lenta(s) (>2s)`,
        );
      }

      // Muitos re-renders
      const highRerenderComponents = componentMetrics.filter(
        (m) => m.rerenderCount > 10,
      );
      if (highRerenderComponents.length > 0) {
        recommendations.push(
          `Reduzir re-renders em ${highRerenderComponents.length} componente(s)`,
        );
      }

      // Uso de memória
      const highMemoryComponents = componentMetrics.filter(
        (m) => m.memoryUsage > 50,
      );
      if (highMemoryComponents.length > 0) {
        recommendations.push(
          `Otimizar uso de memória em ${highMemoryComponents.length} componente(s)`,
        );
      }

      if (recommendations.length === 0) {
        recommendations.push("Performance está boa! Continue monitorando.");
      }

      return recommendations;
    },
    [],
  );

  // Limpeza de métricas antigas
  const clearOldMetrics = useOptimizedCallback(() => {
    performanceMonitor.clearOldMetrics();
    loadMetrics();
  }, [loadMetrics]);

  // Auto-refresh
  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, loadMetrics]);

  // Formatação de valores
  const formatDuration = useOptimizedCallback((duration: number) => {
    if (duration < 1000) return `${duration.toFixed(0)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  }, []);

  const formatMemory = useOptimizedCallback((memory: number) => {
    if (memory < 1024) return `${memory.toFixed(0)}KB`;
    return `${(memory / 1024).toFixed(2)}MB`;
  }, []);

  const getSeverityColor = useOptimizedCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  }, []);

  const getSeverityBadge = useOptimizedCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
            />
            Auto-refresh
          </Button>
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={clearOldMetrics} variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total de Métricas
                  </p>
                  <p className="text-2xl font-bold">
                    {report.summary.totalMetrics}
                  </p>
                </div>
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Críticos
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {report.summary.criticalIssues}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Altos
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {report.summary.highIssues}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Médios
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {report.summary.mediumIssues}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Baixos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {report.summary.lowIssues}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="network">Rede</TabsTrigger>
          <TabsTrigger value="storage">Armazenamento</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {report &&
                  Object.entries(report.categories).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="capitalize">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics && metrics.length > 0 ? metrics.slice(0, 5).map((metric, index) => (
                    <div
                      key={`${metric.id}-${index}`}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{metric.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.category}
                        </p>
                      </div>
                      <Badge variant={getSeverityBadge(metric.severity)}>
                        {metric.severity}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">
                      Nenhuma métrica disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components">
          <Card>
            <CardHeader>
              <CardTitle>Componentes Mais Lentos</CardTitle>
              <CardDescription>
                Componentes com maior tempo de renderização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report && report.slowestComponents.length > 0 ? (
                <div className="space-y-4">
                  {report.slowestComponents.map((component, index) => (
                    <div
                      key={`${component.id}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {component.componentName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Re-renders: {component.rerenderCount}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatDuration(component.renderTime)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatMemory(component.memoryUsage)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhum componente lento detectado
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Requisições Mais Lentas</CardTitle>
              <CardDescription>
                Requisições de rede com maior latência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report && report.slowestNetworkRequests.length > 0 ? (
                <div className="space-y-4">
                  {report.slowestNetworkRequests.map((request, index) => (
                    <div
                      key={`${request.id}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{request.url}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.method} - {request.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatDuration(request.duration)}
                        </p>
                        <Badge
                          variant={
                            request.status >= 400 ? "destructive" : "outline"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma requisição lenta detectada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Operações de Armazenamento Mais Lentas</CardTitle>
              <CardDescription>
                Operações de localStorage/sessionStorage com maior latência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report && report.slowestStorageOperations.length > 0 ? (
                <div className="space-y-4">
                  {report.slowestStorageOperations.map((operation, index) => (
                    <div
                      key={`${operation.id}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{operation.operation}</h4>
                        <p className="text-sm text-muted-foreground">
                          {operation.key}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {formatDuration(operation.duration)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatMemory(operation.dataSize)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma operação lenta detectada
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de Otimização</CardTitle>
              <CardDescription>
                Sugestões para melhorar a performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report && report.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {report.recommendations.map((recommendation, index) => (
                    <Alert key={index}>
                      <Zap className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma recomendação disponível
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default withPerformanceOptimization(PerformanceDashboard, {
  displayName: "PerformanceDashboard",
  enableProfiling: process.env.NODE_ENV === "development",
});
