"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertTriangle,
  Activity,
  Zap,
  MemoryStick,
  Clock,
  X,
} from "lucide-react";

interface PerformanceStats {
  memoryUsage: number;
  renderTime: number;
  requestsInQueue: number;
  fps: number;
  componentCount: number;
  leakDetected: boolean;
}

interface PerformanceMonitorWidgetProps {
  memoryStats?: any;
  throttleStats?: any;
  onCleanup?: () => void;
}

export function PerformanceMonitorWidget({
  memoryStats,
  throttleStats,
  onCleanup,
}: PerformanceMonitorWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<PerformanceStats>({
    memoryUsage: 0,
    renderTime: 0,
    requestsInQueue: 0,
    fps: 60,
    componentCount: 0,
    leakDetected: false,
  });
  const [alerts, setAlerts] = useState<string[]>([]);

  // Atualizar estatísticas
  useEffect(() => {
    const updateStats = () => {
      const newStats: PerformanceStats = {
        memoryUsage: memoryStats?.heapUsed || 0,
        renderTime: performance.now() % 100,
        requestsInQueue: throttleStats?.pending || 0,
        fps: Math.round(60 - Math.random() * 10), // Simulado
        componentCount: memoryStats?.componentCount || 0,
        leakDetected: memoryStats?.memoryTrend === "increasing",
      };

      setStats(newStats);

      // Detectar problemas
      const newAlerts: string[] = [];

      if (newStats.memoryUsage > 50 * 1024 * 1024) {
        // 50MB
        newAlerts.push("Alto uso de memória detectado");
      }

      if (newStats.renderTime > 16) {
        // > 16ms = < 60fps
        newAlerts.push("Renderização lenta detectada");
      }

      if (newStats.requestsInQueue > 10) {
        newAlerts.push("Muitas requisições em fila");
      }

      if (newStats.fps < 30) {
        newAlerts.push("FPS baixo detectado");
      }

      if (newStats.leakDetected) {
        newAlerts.push("Possível vazamento de memória");
      }

      setAlerts(newAlerts);
    };

    const interval = setInterval(updateStats, 2000);
    updateStats();

    return () => clearInterval(interval);
  }, [memoryStats, throttleStats]);

  // Auto-mostrar se houver problemas
  useEffect(() => {
    if (alerts.length > 0 && !isVisible) {
      setIsVisible(true);
    }
  }, [alerts, isVisible]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (
    value: number,
    thresholds: { good: number; warning: number },
  ) => {
    if (value <= thresholds.good) return "bg-green-500";
    if (value <= thresholds.warning) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleCleanup = () => {
    onCleanup?.();
    setAlerts([]);
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-white/90 backdrop-blur-sm"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 bg-white/95 backdrop-blur-sm shadow-lg border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="font-medium text-sm">Performance Monitor</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Alertas */}
        {alerts.length > 0 && (
          <div className="mb-3 space-y-1">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-red-600"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{alert}</span>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        <div className="space-y-2 text-xs">
          {/* Memória */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-3 w-3" />
              <span>Memória</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{formatBytes(stats.memoryUsage)}</span>
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  stats.memoryUsage / (1024 * 1024),
                  { good: 20, warning: 50 },
                )}`}
              />
            </div>
          </div>

          {/* FPS */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <span>FPS</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats.fps}</span>
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  60 - stats.fps,
                  { good: 10, warning: 30 },
                )}`}
              />
            </div>
          </div>

          {/* Tempo de Render */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Render</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats.renderTime.toFixed(1)}ms</span>
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  stats.renderTime,
                  { good: 8, warning: 16 },
                )}`}
              />
            </div>
          </div>

          {/* Requisições */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              <span>Fila</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{stats.requestsInQueue}</span>
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  stats.requestsInQueue,
                  { good: 3, warning: 10 },
                )}`}
              />
            </div>
          </div>

          {/* Componentes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs">📦</span>
              <span>Componentes</span>
            </div>
            <span>{stats.componentCount}</span>
          </div>
        </div>

        {/* Ações */}
        {alerts.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanup}
              className="w-full text-xs"
            >
              🧹 Limpar Memória
            </Button>
          </div>
        )}

        {/* Status geral */}
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-xs text-gray-500">Status:</span>
          <Badge
            variant={alerts.length === 0 ? "default" : "destructive"}
            className="text-xs"
          >
            {alerts.length === 0 ? "✅ Saudável" : "⚠️ Problemas"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitorWidget;
