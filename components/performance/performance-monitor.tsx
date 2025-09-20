"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Activity, Zap, Database, Clock } from "lucide-react";
import {
  financialCache,
  calculationCache,
  uiCache,
} from "../../lib/optimization/smart-cache";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  loadTime: number;
  fps: number;
}

interface PerformanceMonitorProps {
  componentName?: string;
  showDetails?: boolean;
}

export function PerformanceMonitor({
  componentName = "Dashboard",
  showDetails = false,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    loadTime: 0,
    fps: 0,
  });
  const [isVisible, setIsVisible] = useState(false);
  const renderStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  // Medir tempo de renderização
  useEffect(() => {
    renderStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics((prev) => ({ ...prev, renderTime }));
    };
  }, []); // Adicionar array de dependências vazio

  // Monitorar FPS
  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCount.current++;

      if (now - lastFrameTime.current >= 1000) {
        const fps = Math.round(
          (frameCount.current * 1000) / (now - lastFrameTime.current),
        );
        setMetrics((prev) => ({ ...prev, fps }));
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    if (isVisible) {
      lastFrameTime.current = performance.now();
      measureFPS();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isVisible]);

  // Coletar métricas periodicamente
  useEffect(() => {
    if (!isVisible) return;

    const collectMetrics = () => {
      // Memória (se disponível)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      // Cache hit rate
      const financialStats = financialCache.getStats();
      const calculationStats = calculationCache.getStats();
      const uiStats = uiCache.getStats();

      const totalHitRate =
        (financialStats.hitRate + calculationStats.hitRate + uiStats.hitRate) /
        3;

      // Tempo de carregamento (Navigation Timing API)
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const loadTime = navigation
        ? navigation.loadEventEnd - navigation.fetchStart
        : 0;

      setMetrics((prev) => ({
        ...prev,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
        cacheHitRate: Math.round(totalHitRate * 100),
        loadTime: Math.round(loadTime),
      }));
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const getPerformanceStatus = (renderTime: number) => {
    if (renderTime < 16) return { status: "Excelente", color: "bg-green-500" };
    if (renderTime < 33) return { status: "Bom", color: "bg-yellow-500" };
    return { status: "Lento", color: "bg-red-500" };
  };

  const getCacheStatus = (hitRate: number) => {
    if (hitRate > 80) return { status: "Ótimo", color: "bg-green-500" };
    if (hitRate > 60) return { status: "Bom", color: "bg-yellow-500" };
    return { status: "Baixo", color: "bg-red-500" };
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="w-4 h-4 mr-2" />
        Performance
      </Button>
    );
  }

  const performanceStatus = getPerformanceStatus(metrics.renderTime);
  const cacheStatus = getCacheStatus(metrics.cacheHitRate);

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance - {componentName}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tempo de Renderização */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Render</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">
              {metrics.renderTime.toFixed(1)}ms
            </span>
            <Badge className={`${performanceStatus.color} text-white text-xs`}>
              {performanceStatus.status}
            </Badge>
          </div>
        </div>

        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span className="text-sm">FPS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{metrics.fps}</span>
            <Badge
              className={`${metrics.fps >= 50 ? "bg-green-500" : metrics.fps >= 30 ? "bg-yellow-500" : "bg-red-500"} text-white text-xs`}
            >
              {metrics.fps >= 50
                ? "Fluido"
                : metrics.fps >= 30
                  ? "OK"
                  : "Lento"}
            </Badge>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Cache</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">{metrics.cacheHitRate}%</span>
            <Badge className={`${cacheStatus.color} text-white text-xs`}>
              {cacheStatus.status}
            </Badge>
          </div>
        </div>

        {/* Memória (se disponível) */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Memória</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">{metrics.memoryUsage}MB</span>
              <Badge
                className={`${metrics.memoryUsage < 50 ? "bg-green-500" : metrics.memoryUsage < 100 ? "bg-yellow-500" : "bg-red-500"} text-white text-xs`}
              >
                {metrics.memoryUsage < 50
                  ? "Baixo"
                  : metrics.memoryUsage < 100
                    ? "Médio"
                    : "Alto"}
              </Badge>
            </div>
          </div>
        )}

        {showDetails && (
          <div className="pt-2 border-t text-xs text-gray-500 space-y-1">
            <div>Load Time: {metrics.loadTime}ms</div>
            <div>
              Cache Sizes: F:{financialCache.size()} C:{calculationCache.size()}{" "}
              U:{uiCache.size()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitor;
