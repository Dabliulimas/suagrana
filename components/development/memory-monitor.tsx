"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/utils/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
// Removed problematic import
import {
  Trash2,
  RefreshCw,
  Activity,
  Database,
  Image,
  Cpu,
} from "lucide-react";

interface MemoryStats {
  cache: {
    size: number;
    memoryUsage: number;
    maxSize: number;
    utilizationPercent: number;
  };
  images: {
    cachedImages: number;
    loadedImages: number;
  };
  runtime: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  observers: number;
  monitoringActive: boolean;
}

export function MemoryMonitor() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { getStats, forceCleanup } = useMemoryOptimization();

  useEffect(() => {
    // Só mostra em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
      updateStats();

      const interval = setInterval(updateStats, 2000);
      return () => clearInterval(interval);
    }
  }, []);

  const updateStats = () => {
    try {
      const memoryStats = getStats();
      setStats(memoryStats);
    } catch (error) {
      console.warn("Erro ao obter estatísticas de memória:", error);
    }
  };

  const handleCleanup = () => {
    forceCleanup();
    updateStats();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUtilizationColor = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isVisible || !stats) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Monitor de Memória
            <Badge
              variant={stats.monitoringActive ? "default" : "secondary"}
              className="ml-auto"
            >
              {stats.monitoringActive ? "Ativo" : "Inativo"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cache Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Cache</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Utilização</span>
                <span>{stats.cache.utilizationPercent.toFixed(1)}%</span>
              </div>
              <Progress
                value={stats.cache.utilizationPercent}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(stats.cache.memoryUsage)}</span>
                <span>{formatBytes(stats.cache.maxSize)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.cache.size} itens em cache
              </div>
            </div>
          </div>

          {/* Images Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" aria-label="Ícone de imagens" />
              <span className="text-sm font-medium">Imagens</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Cache: </span>
                <span>{stats.images.cachedImages}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Carregadas: </span>
                <span>{stats.images.loadedImages}</span>
              </div>
            </div>
          </div>

          {/* Runtime Stats */}
          {stats.runtime.usedJSHeapSize && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                <span className="text-sm font-medium">JS Heap</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Usado</span>
                  <span>{stats.runtime.usedJSHeapSize}MB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Total</span>
                  <span>{stats.runtime.totalJSHeapSize}MB</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Limite</span>
                  <span>{stats.runtime.jsHeapSizeLimit}MB</span>
                </div>
                {stats.runtime.totalJSHeapSize &&
                  stats.runtime.jsHeapSizeLimit && (
                    <Progress
                      value={
                        (stats.runtime.totalJSHeapSize /
                          stats.runtime.jsHeapSizeLimit) *
                        100
                      }
                      className="h-2"
                    />
                  )}
              </div>
            </div>
          )}

          {/* Observers */}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Observers ativos:</span>
            <span>{stats.observers}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={updateStats}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCleanup}
              className="flex-1"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Warning */}
          {stats.cache.utilizationPercent > 90 && (
            <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              ⚠️ Cache próximo do limite! Considere fazer limpeza.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MemoryMonitor;
