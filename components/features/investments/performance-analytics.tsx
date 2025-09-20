"use client";

import React, { useState, useMemo } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  AlertCircle,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import {
  Investment,
  InvestmentOperation,
  AssetType,
} from "../../../lib/types/investments";
import { formatCurrency, formatPercentage, formatDate } from "../../../lib/utils";
import { toast } from "sonner";

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageGain: number;
  averageLoss: number;
  profitFactor: number;
  calmarRatio: number;
  sortinRatio: number;
}

interface AssetPerformance {
  investmentId: string;
  identifier: string;
  name: string;
  assetType: AssetType;
  totalReturn: number;
  returnPercentage: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  contribution: number;
  rank: number;
  trend: "up" | "down" | "stable";
}

interface BenchmarkComparison {
  benchmark: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  correlation: number;
  trackingError: number;
  informationRatio: number;
}

interface PeriodPerformance {
  period: string;
  startDate: Date;
  endDate: Date;
  return: number;
  returnPercentage: number;
  benchmark: number;
  outperformance: number;
}

const BENCHMARKS = {
  IBOV: { name: "Ibovespa", return: 0.12 }, // 12% anual simulado
  CDI: { name: "CDI", return: 0.1375 }, // 13.75% anual simulado
  IFIX: { name: "IFIX", return: 0.08 }, // 8% anual simulado
  SP500: { name: "S&P 500", return: 0.1 }, // 10% anual simulado
};

export function PerformanceAnalytics() {
  const { state } = useInvestments();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "1m" | "3m" | "6m" | "1y" | "2y" | "ytd" | "all"
  >("1y");
  const [selectedBenchmark, setSelectedBenchmark] =
    useState<keyof typeof BENCHMARKS>("IBOV");
  const [loading, setLoading] = useState(false);

  const performanceData = useMemo(() => {
    try {
      const activeInvestments = state.investments.filter(
        (inv) => inv.status === "active",
      );
      const operations = state?.operations || [];

      if (activeInvestments.length === 0) {
        return {
          portfolioMetrics: getEmptyMetrics(),
          assetPerformance: [],
          benchmarkComparison: getEmptyBenchmark(),
          periodPerformance: [],
        };
      }

      // Filtrar operações por período
      const periodStart = getPeriodStart(selectedPeriod);
      const filteredOperations = operations.filter(
        (op) => new Date(op.operationDate) >= periodStart,
      );

      // Calcular métricas do portfólio
      const portfolioMetrics = calculatePortfolioMetrics(
        activeInvestments,
        filteredOperations,
        periodStart,
      );

      // Calcular performance por ativo
      const assetPerformance = calculateAssetPerformance(
        activeInvestments,
        filteredOperations,
      );

      // Comparação com benchmark
      const benchmarkComparison = calculateBenchmarkComparison(
        portfolioMetrics,
        BENCHMARKS[selectedBenchmark],
        periodStart,
      );

      // Performance por período
      const periodPerformance = calculatePeriodPerformance(
        activeInvestments,
        operations,
      );

      return {
        portfolioMetrics,
        assetPerformance,
        benchmarkComparison,
        periodPerformance,
      };
    } catch (error) {
      logComponents.error("Erro ao calcular análise de performance:", error);
      toast.error("Erro ao calcular análise de performance");
      return {
        portfolioMetrics: getEmptyMetrics(),
        assetPerformance: [],
        benchmarkComparison: getEmptyBenchmark(),
        periodPerformance: [],
      };
    }
  }, [
    state?.investments,
    state?.operations,
    selectedPeriod,
    selectedBenchmark,
  ]);

  const handleExportAnalysis = async () => {
    try {
      setLoading(true);

      const analysisData = {
        period: selectedPeriod,
        benchmark: selectedBenchmark,
        data: performanceData,
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analise-performance-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Análise exportada com sucesso!");
    } catch (error) {
      logComponents.error("Erro ao exportar análise:", error);
      toast.error("Erro ao exportar análise");
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (value: number, isPercentage = false) => {
    const threshold = isPercentage ? 0 : 0;
    return value >= threshold ? "text-green-600" : "text-red-600";
  };

  const getRiskLevel = (volatility: number) => {
    if (volatility < 10) return { label: "Baixo", color: "text-green-600" };
    if (volatility < 20) return { label: "Médio", color: "text-yellow-600" };
    return { label: "Alto", color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análise de Performance</h2>
          <p className="text-muted-foreground">
            Métricas avançadas e comparações de benchmark
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1m">Último mês</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último ano</option>
            <option value="2y">Últimos 2 anos</option>
            <option value="ytd">Ano atual</option>
            <option value="all">Todo período</option>
          </select>
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            {Object.entries(BENCHMARKS).map(([key, benchmark]) => (
              <option key={key} value={key}>
                {benchmark.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleExportAnalysis}
            disabled={loading}
            variant="outline"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retorno Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getMetricColor(performanceData.portfolioMetrics.totalReturn)}`}
            >
              {formatCurrency(performanceData.portfolioMetrics.totalReturn)}
            </div>
            <p
              className={`text-xs ${getMetricColor(performanceData.portfolioMetrics.totalReturnPercentage, true)}`}
            >
              {performanceData.portfolioMetrics.totalReturnPercentage > 0
                ? "+"
                : ""}
              {formatPercentage(
                performanceData.portfolioMetrics.totalReturnPercentage,
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Retorno Anualizado
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getMetricColor(performanceData.portfolioMetrics.annualizedReturn, true)}`}
            >
              {performanceData.portfolioMetrics.annualizedReturn > 0 ? "+" : ""}
              {formatPercentage(
                performanceData.portfolioMetrics.annualizedReturn,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Sharpe: {performanceData.portfolioMetrics.sharpeRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatilidade</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(performanceData.portfolioMetrics.volatility)}
            </div>
            <p
              className={`text-xs ${getRiskLevel(performanceData.portfolioMetrics.volatility).color}`}
            >
              Risco{" "}
              {getRiskLevel(performanceData.portfolioMetrics.volatility).label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(performanceData.portfolioMetrics.maxDrawdown)}
            </div>
            <p className="text-xs text-muted-foreground">Maior perda</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com análises detalhadas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="assets">Por Ativo</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          <TabsTrigger value="periods">Períodos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Risco-Retorno</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Taxa de Acerto:</span>
                  <span className="font-medium">
                    {formatPercentage(performanceData.portfolioMetrics.winRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ganho Médio:</span>
                  <span className="font-medium text-green-600">
                    {formatPercentage(
                      performanceData.portfolioMetrics.averageGain,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Perda Média:</span>
                  <span className="font-medium text-red-600">
                    {formatPercentage(
                      performanceData.portfolioMetrics.averageLoss,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fator de Lucro:</span>
                  <span
                    className={`font-medium ${getMetricColor(performanceData.portfolioMetrics.profitFactor - 1)}`}
                  >
                    {performanceData.portfolioMetrics.profitFactor.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Índice Sharpe:</span>
                  <span className="font-medium">
                    {performanceData.portfolioMetrics.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Índice Calmar:</span>
                  <span className="font-medium">
                    {performanceData.portfolioMetrics.calmarRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Índice Sortino:</span>
                  <span className="font-medium">
                    {performanceData.portfolioMetrics.sortinRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Volatilidade:</span>
                  <span className="font-medium">
                    {formatPercentage(
                      performanceData.portfolioMetrics.volatility,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.assetPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhum ativo encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {performanceData.assetPerformance.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {asset.identifier}
                          </span>
                          <Badge variant="outline">#{asset.rank}</Badge>
                          <Badge
                            variant={
                              asset.trend === "up"
                                ? "default"
                                : asset.trend === "stable"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {asset.trend === "up"
                              ? "↗"
                              : asset.trend === "stable"
                                ? "→"
                                : "↘"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {asset.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Contribuição: {formatPercentage(asset.contribution)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${getMetricColor(asset.totalReturn)}`}
                        >
                          {formatCurrency(asset.totalReturn)}
                        </div>
                        <div
                          className={`text-sm ${getMetricColor(asset.returnPercentage, true)}`}
                        >
                          {asset.returnPercentage > 0 ? "+" : ""}
                          {formatPercentage(asset.returnPercentage)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Anual: {formatPercentage(asset.annualizedReturn)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Comparação com {BENCHMARKS[selectedBenchmark].name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Retorno do Portfólio:</span>
                    <span
                      className={`font-medium ${getMetricColor(performanceData.benchmarkComparison.portfolioReturn, true)}`}
                    >
                      {formatPercentage(
                        performanceData.benchmarkComparison.portfolioReturn,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retorno do Benchmark:</span>
                    <span className="font-medium">
                      {formatPercentage(
                        performanceData.benchmarkComparison.benchmarkReturn,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alpha (Excesso):</span>
                    <span
                      className={`font-medium ${getMetricColor(performanceData.benchmarkComparison.alpha, true)}`}
                    >
                      {performanceData.benchmarkComparison.alpha > 0 ? "+" : ""}
                      {formatPercentage(
                        performanceData.benchmarkComparison.alpha,
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Beta:</span>
                    <span className="font-medium">
                      {performanceData.benchmarkComparison.beta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Correlação:</span>
                    <span className="font-medium">
                      {performanceData.benchmarkComparison.correlation.toFixed(
                        2,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tracking Error:</span>
                    <span className="font-medium">
                      {formatPercentage(
                        performanceData.benchmarkComparison.trackingError,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="periods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Período</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.periodPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Dados insuficientes para análise por período</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {performanceData.periodPerformance.map((period, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{period.period}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(period.startDate)} -{" "}
                          {formatDate(period.endDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${getMetricColor(period.return)}`}
                        >
                          {formatCurrency(period.return)}
                        </div>
                        <div
                          className={`text-sm ${getMetricColor(period.returnPercentage, true)}`}
                        >
                          {period.returnPercentage > 0 ? "+" : ""}
                          {formatPercentage(period.returnPercentage)}
                        </div>
                        <div
                          className={`text-xs ${getMetricColor(period.outperformance, true)}`}
                        >
                          vs Benchmark: {period.outperformance > 0 ? "+" : ""}
                          {formatPercentage(period.outperformance)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Funções auxiliares
function getPeriodStart(period: string): Date {
  const now = new Date();
  const date = new Date(now);

  switch (period) {
    case "1m":
      date.setMonth(date.getMonth() - 1);
      break;
    case "3m":
      date.setMonth(date.getMonth() - 3);
      break;
    case "6m":
      date.setMonth(date.getMonth() - 6);
      break;
    case "1y":
      date.setFullYear(date.getFullYear() - 1);
      break;
    case "2y":
      date.setFullYear(date.getFullYear() - 2);
      break;
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return new Date(2000, 0, 1);
    default:
      date.setFullYear(date.getFullYear() - 1);
  }

  return date;
}

function getEmptyMetrics(): PerformanceMetrics {
  return {
    totalReturn: 0,
    totalReturnPercentage: 0,
    annualizedReturn: 0,
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    winRate: 0,
    averageGain: 0,
    averageLoss: 0,
    profitFactor: 0,
    calmarRatio: 0,
    sortinRatio: 0,
  };
}

function getEmptyBenchmark(): BenchmarkComparison {
  return {
    benchmark: "",
    portfolioReturn: 0,
    benchmarkReturn: 0,
    alpha: 0,
    beta: 0,
    correlation: 0,
    trackingError: 0,
    informationRatio: 0,
  };
}

function calculatePortfolioMetrics(
  investments: Investment[],
  operations: InvestmentOperation[],
  periodStart: Date,
): PerformanceMetrics {
  const totalInvested = investments.reduce(
    (sum, inv) => sum + inv.totalInvested,
    0,
  );
  const totalCurrent = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0,
  );
  const totalReturn = totalCurrent - totalInvested;
  const totalReturnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  // Calcular retorno anualizado (simplificado)
  const daysDiff = (Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
  const yearsFraction = daysDiff / 365;
  const annualizedReturn =
    yearsFraction > 0
      ? (Math.pow(1 + totalReturnPercentage / 100, 1 / yearsFraction) - 1) * 100
      : 0;

  // Métricas simplificadas (em produção, usar dados históricos reais)
  const volatility = Math.abs(totalReturnPercentage) * 0.8; // Estimativa
  const riskFreeRate = 13.75; // CDI aproximado
  const sharpeRatio =
    volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

  const gains = operations.filter(
    (op) => op.operationType === "sell" && op.totalValue > 0,
  );
  const losses = operations.filter(
    (op) => op.operationType === "sell" && op.totalValue < 0,
  );

  const winRate =
    operations.length > 0 ? (gains.length / operations.length) * 100 : 0;
  const averageGain =
    gains.length > 0
      ? gains.reduce((sum, op) => sum + op.totalValue, 0) / gains.length
      : 0;
  const averageLoss =
    losses.length > 0
      ? Math.abs(
          losses.reduce((sum, op) => sum + op.totalValue, 0) / losses.length,
        )
      : 0;
  const profitFactor = averageLoss > 0 ? averageGain / averageLoss : 0;

  return {
    totalReturn,
    totalReturnPercentage,
    annualizedReturn,
    volatility,
    sharpeRatio,
    maxDrawdown: Math.min(0, totalReturnPercentage * 0.6), // Estimativa
    winRate,
    averageGain: averageGain > 0 ? (averageGain / totalInvested) * 100 : 0,
    averageLoss: averageLoss > 0 ? (averageLoss / totalInvested) * 100 : 0,
    profitFactor,
    calmarRatio:
      Math.abs(totalReturnPercentage * 0.6) > 0
        ? annualizedReturn / Math.abs(totalReturnPercentage * 0.6)
        : 0,
    sortinRatio: sharpeRatio * 1.2, // Estimativa
  };
}

function calculateAssetPerformance(
  investments: Investment[],
  operations: InvestmentOperation[],
): AssetPerformance[] {
  return investments
    .map((inv, index) => {
      const totalReturn = inv.currentValue - inv.totalInvested;
      const returnPercentage =
        inv.totalInvested > 0 ? (totalReturn / inv.totalInvested) * 100 : 0;
      const annualizedReturn = returnPercentage; // Simplificado
      const volatility = Math.abs(returnPercentage) * 0.8;
      const sharpeRatio =
        volatility > 0 ? (annualizedReturn - 13.75) / volatility : 0;

      return {
        investmentId: inv.id,
        identifier: inv.identifier,
        name: inv.name || inv.identifier,
        assetType: inv.assetType,
        totalReturn,
        returnPercentage,
        annualizedReturn,
        volatility,
        sharpeRatio,
        contribution: returnPercentage, // Simplificado
        rank: index + 1,
        trend:
          returnPercentage > 5
            ? "up"
            : returnPercentage < -5
              ? "down"
              : "stable",
      };
    })
    .sort((a, b) => b.returnPercentage - a.returnPercentage)
    .map((asset, index) => ({ ...asset, rank: index + 1 }));
}

function calculateBenchmarkComparison(
  portfolioMetrics: PerformanceMetrics,
  benchmark: { name: string; return: number },
  periodStart: Date,
): BenchmarkComparison {
  const benchmarkReturn = benchmark.return * 100;
  const alpha = portfolioMetrics.annualizedReturn - benchmarkReturn;

  return {
    benchmark: benchmark.name,
    portfolioReturn: portfolioMetrics.annualizedReturn,
    benchmarkReturn,
    alpha,
    beta: 1.0, // Simplificado
    correlation: 0.7, // Simplificado
    trackingError: Math.abs(alpha) * 0.5, // Estimativa
    informationRatio: Math.abs(alpha) > 0 ? alpha / (Math.abs(alpha) * 0.5) : 0,
  };
}

function calculatePeriodPerformance(
  investments: Investment[],
  operations: InvestmentOperation[],
): PeriodPerformance[] {
  // Implementação simplificada - em produção, calcular por períodos reais
  const periods = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"];

  return periods.map((period, index) => {
    const startDate = new Date(2024, index * 3, 1);
    const endDate = new Date(2024, (index + 1) * 3, 0);
    const return_ = Math.random() * 20000 - 10000; // Simulado
    const returnPercentage = Math.random() * 20 - 10; // Simulado
    const benchmark = Math.random() * 15 - 5; // Simulado

    return {
      period,
      startDate,
      endDate,
      return: return_,
      returnPercentage,
      benchmark,
      outperformance: returnPercentage - benchmark,
    };
  });
}
