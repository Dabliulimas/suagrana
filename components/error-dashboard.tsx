"use client";

import React, { useState, useEffect } from "react";
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
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { useErrorContext } from "../contexts/error-context";
import {
  AlertTriangle,
  Bug,
  Download,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "sonner";

interface ErrorDashboardProps {
  className?: string;
}

export function ErrorDashboard({ className }: ErrorDashboardProps) {
  const {
    errors,
    clearError,
    clearAllErrors,
    getUnresolvedErrors,
    getCriticalErrors,
    exportErrorReport,
    isOnline,
    retryQueue,
    processRetryQueue,
  } = useErrorContext();

  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unresolved" | "critical">(
    "unresolved",
  );

  const unresolvedErrors = getUnresolvedErrors();
  const criticalErrors = getCriticalErrors();

  const filteredErrors = {
    all: errors,
    unresolved: unresolvedErrors,
    critical: criticalErrors,
  }[filter];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/20 dark:text-gray-400 dark:border-gray-700";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      case "low":
        return <Info className="w-4 h-4" />;
      default:
        return <Bug className="w-4 h-4" />;
    }
  };

  const handleExportReport = () => {
    const report = exportErrorReport();
    const blob = new Blob([report], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Relatório de erros exportado!");
  };

  const handleProcessRetryQueue = async () => {
    try {
      await processRetryQueue();
      toast.success("Fila de retry processada!");
    } catch (error) {
      toast.error("Erro ao processar fila de retry");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total de Erros
                </p>
                <p className="text-2xl font-bold">{errors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Não Resolvidos
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {unresolvedErrors.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Críticos</p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalErrors.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isOnline ? "text-green-600" : "text-red-600",
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportReport}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar Relatório
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearAllErrors}
          className="gap-2"
          disabled={unresolvedErrors.length === 0}
        >
          <CheckCircle className="w-4 h-4" />
          Marcar Todos como Resolvidos
        </Button>

        {retryQueue.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessRetryQueue}
            className="gap-2"
            disabled={!isOnline}
          >
            <RefreshCw className="w-4 h-4" />
            Processar Fila ({retryQueue.length})
          </Button>
        )}
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento de Erros</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os erros do sistema em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="unresolved">
                Não Resolvidos ({unresolvedErrors.length})
              </TabsTrigger>
              <TabsTrigger value="critical">
                Críticos ({criticalErrors.length})
              </TabsTrigger>
              <TabsTrigger value="all">Todos ({errors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {filteredErrors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === "all"
                      ? "Nenhum erro registrado"
                      : filter === "critical"
                        ? "Nenhum erro crítico"
                        : "Nenhum erro não resolvido"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredErrors.map((error) => (
                      <div
                        key={error.id}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-colors",
                          selectedError === error.id
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50",
                          error.resolved && "opacity-60",
                        )}
                        onClick={() =>
                          setSelectedError(
                            selectedError === error.id ? null : error.id,
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {getSeverityIcon(error.severity)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge
                                  className={getSeverityColor(error.severity)}
                                >
                                  {error.severity.toUpperCase()}
                                </Badge>
                                <Badge variant="outline">{error.code}</Badge>
                                {error.resolved && (
                                  <Badge variant="secondary">Resolvido</Badge>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 truncate">
                                {error.message}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {error.timestamp.toLocaleString()}
                                  </span>
                                </span>
                                {error.page && (
                                  <span>Página: {error.page}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!error.resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearError(error.id);
                                  toast.success("Erro marcado como resolvido");
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {selectedError === error.id && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Contexto
                                </h4>
                                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                  {JSON.stringify(error.context, null, 2)}
                                </pre>
                              </div>

                              {error.context?.stack && (
                                <div>
                                  <h4 className="font-medium text-gray-900 mb-2">
                                    Stack Trace
                                  </h4>
                                  <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto text-red-800">
                                    {error.context.stack}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
