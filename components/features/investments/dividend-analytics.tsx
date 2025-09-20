"use client";

import React, { useState, useMemo } from "react";
import { logComponents } from "../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  AlertCircle,
  Download,
} from "lucide-react";
import { useInvestments } from "../../../contexts/unified-context";
import {
  Investment,
  InvestmentOperation,
  DividendType,
} from "../../../lib/types/investments";
import { formatCurrency, formatPercentage, formatDate } from "../../../lib/utils";
import { toast } from "sonner";

interface DividendAnalytics {
  totalReceived: number;
  monthlyAverage: number;
  yearlyProjection: number;
  averageYield: number;
  growthRate: number;
  consistency: number;
  nextExpectedPayments: DividendPayment[];
  monthlyHistory: MonthlyDividend[];
  assetBreakdown: AssetDividendBreakdown[];
}

interface DividendPayment {
  investmentId: string;
  identifier: string;
  name: string;
  expectedDate: Date;
  estimatedValue: number;
  confidence: "high" | "medium" | "low";
  lastPayment?: Date;
}

interface MonthlyDividend {
  month: string;
  year: number;
  total: number;
  count: number;
  assets: { identifier: string; value: number }[];
}

interface AssetDividendBreakdown {
  investmentId: string;
  identifier: string;
  name: string;
  totalReceived: number;
  percentage: number;
  yieldPercentage: number;
  frequency: number;
  lastPayment?: Date;
  trend: "up" | "down" | "stable";
}

export function DividendAnalytics() {
  const { state } = useInvestments();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "3m" | "6m" | "1y" | "2y" | "all"
  >("1y");
  const [loading, setLoading] = useState(false);

  const dividendAnalytics = useMemo((): DividendAnalytics => {
    try {
      const dividendOperations = (state?.operations || []).filter(
        (op) => op.operationType === "dividend" || op.operationType === "jscp",
      );

      if (dividendOperations.length === 0) {
        return {
          totalReceived: 0,
          monthlyAverage: 0,
          yearlyProjection: 0,
          averageYield: 0,
          growthRate: 0,
          consistency: 0,
          nextExpectedPayments: [],
          monthlyHistory: [],
          assetBreakdown: [],
        };
      }

      // Filtrar por período
      const now = new Date();
      const periodStart = getPeriodStart(selectedPeriod, now);
      const filteredOperations = dividendOperations.filter(
        (op) => new Date(op.operationDate) >= periodStart,
      );

      // Calcular métricas básicas
      const totalReceived = filteredOperations.reduce(
        (sum, op) => sum + op.totalValue,
        0,
      );
      const monthsInPeriod = getMonthsDifference(periodStart, now);
      const monthlyAverage =
        monthsInPeriod > 0 ? totalReceived / monthsInPeriod : 0;
      const yearlyProjection = monthlyAverage * 12;

      // Calcular yield médio
      const totalInvested = state.investments.reduce(
        (sum, inv) => sum + inv.totalInvested,
        0,
      );
      const averageYield =
        totalInvested > 0 ? (yearlyProjection / totalInvested) * 100 : 0;

      // Calcular taxa de crescimento
      const growthRate = calculateGrowthRate(filteredOperations);

      // Calcular consistência (% de meses com dividendos)
      const consistency = calculateConsistency(
        filteredOperations,
        monthsInPeriod,
      );

      // Próximos pagamentos esperados
      const nextExpectedPayments = generateExpectedPayments(
        state.investments,
        dividendOperations,
      );

      // Histórico mensal
      const monthlyHistory = generateMonthlyHistory(filteredOperations);

      // Breakdown por ativo
      const assetBreakdown = generateAssetBreakdown(
        state.investments,
        dividendOperations,
      );

      return {
        totalReceived,
        monthlyAverage,
        yearlyProjection,
        averageYield,
        growthRate,
        consistency,
        nextExpectedPayments,
        monthlyHistory,
        assetBreakdown,
      };
    } catch (error) {
      logComponents.error("Erro ao calcular análise de dividendos:", error);
      toast.error("Erro ao calcular análise de dividendos");
      return {
        totalReceived: 0,
        monthlyAverage: 0,
        yearlyProjection: 0,
        averageYield: 0,
        growthRate: 0,
        consistency: 0,
        nextExpectedPayments: [],
        monthlyHistory: [],
        assetBreakdown: [],
      };
    }
  }, [state?.operations, state?.investments, selectedPeriod]);

  const handleExportReport = async () => {
    try {
      setLoading(true);
      // Implementar exportação de relatório
      const reportData = {
        period: selectedPeriod,
        analytics: dividendAnalytics,
        generatedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-dividendos-${selectedPeriod}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      logComponents.error("Erro ao exportar relatório:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Análise de Dividendos</h2>
          <p className="text-muted-foreground">
            Acompanhe seus rendimentos e projeções
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="1y">Último ano</option>
            <option value="2y">Últimos 2 anos</option>
            <option value="all">Todo período</option>
          </select>
          <Button
            onClick={handleExportReport}
            disabled={loading}
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dividendAnalytics.totalReceived)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média mensal: {formatCurrency(dividendAnalytics.monthlyAverage)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projeção Anual
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dividendAnalytics.yearlyProjection)}
            </div>
            <p className="text-xs text-muted-foreground">
              Yield médio: {formatPercentage(dividendAnalytics.averageYield)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dividendAnalytics.growthRate > 0 ? "+" : ""}
              {formatPercentage(dividendAnalytics.growthRate)}
            </div>
            <p className="text-xs text-muted-foreground">Taxa de crescimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consistência</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(dividendAnalytics.consistency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Meses com dividendos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com análises detalhadas */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="breakdown">Por Ativo</TabsTrigger>
          <TabsTrigger value="projections">Projeções</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximos Pagamentos Esperados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dividendAnalytics.nextExpectedPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhum pagamento esperado encontrado</p>
                  <p className="text-sm">
                    Adicione mais operações de dividendos para ver projeções
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dividendAnalytics.nextExpectedPayments.map(
                    (payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {payment.identifier}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(payment.estimatedValue)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(payment.expectedDate)}
                          </div>
                          <Badge
                            variant={
                              payment.confidence === "high"
                                ? "default"
                                : payment.confidence === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {payment.confidence === "high"
                              ? "Alta confiança"
                              : payment.confidence === "medium"
                                ? "Média confiança"
                                : "Baixa confiança"}
                          </Badge>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              {dividendAnalytics.monthlyHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhum histórico de dividendos encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dividendAnalytics.monthlyHistory.map((month, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {month.month}/{month.year}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {month.count} pagamentos
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(month.total)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {month.assets.length} ativos
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Breakdown por Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              {dividendAnalytics.assetBreakdown.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>Nenhum ativo com dividendos encontrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dividendAnalytics.assetBreakdown.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{asset.identifier}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Yield: {formatPercentage(asset.yieldPercentage)} |
                          Frequência: {asset.frequency}x/ano
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(asset.totalReceived)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(asset.percentage)} do total
                        </div>
                        <Badge
                          variant={
                            asset.trend === "up"
                              ? "default"
                              : asset.trend === "stable"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {asset.trend === "up"
                            ? "↗ Crescendo"
                            : asset.trend === "stable"
                              ? "→ Estável"
                              : "↘ Declinando"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projeções e Cenários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-green-600">
                    Cenário Otimista
                  </h4>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(dividendAnalytics.yearlyProjection * 1.2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    +20% de crescimento
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-blue-600">
                    Cenário Realista
                  </h4>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(dividendAnalytics.yearlyProjection)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Baseado na média atual
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-orange-600">
                    Cenário Conservador
                  </h4>
                  <div className="text-2xl font-bold mt-2">
                    {formatCurrency(dividendAnalytics.yearlyProjection * 0.8)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    -20% de redução
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Funções auxiliares
function getPeriodStart(period: string, now: Date): Date {
  const date = new Date(now);
  switch (period) {
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
    case "all":
      return new Date(2000, 0, 1); // Data muito antiga
    default:
      date.setFullYear(date.getFullYear() - 1);
  }
  return date;
}

function getMonthsDifference(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

function calculateGrowthRate(operations: InvestmentOperation[]): number {
  if (operations.length < 2) return 0;

  const sortedOps = operations.sort(
    (a, b) =>
      new Date(a.operationDate).getTime() - new Date(b.operationDate).getTime(),
  );

  const firstHalf = sortedOps.slice(0, Math.floor(sortedOps.length / 2));
  const secondHalf = sortedOps.slice(Math.floor(sortedOps.length / 2));

  const firstHalfTotal = firstHalf.reduce((sum, op) => sum + op.totalValue, 0);
  const secondHalfTotal = secondHalf.reduce(
    (sum, op) => sum + op.totalValue,
    0,
  );

  if (firstHalfTotal === 0) return 0;

  return ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100;
}

function calculateConsistency(
  operations: InvestmentOperation[],
  totalMonths: number,
): number {
  if (totalMonths === 0) return 0;

  const monthsWithDividends = new Set(
    operations.map((op) => {
      const date = new Date(op.operationDate);
      return `${date.getFullYear()}-${date.getMonth()}`;
    }),
  ).size;

  return (monthsWithDividends / totalMonths) * 100;
}

function generateExpectedPayments(
  investments: Investment[],
  operations: InvestmentOperation[],
): DividendPayment[] {
  // Implementação simplificada - em produção, usaria dados históricos mais complexos
  return investments
    .filter((inv) => inv.status === "active")
    .map((inv) => {
      const lastDividend = operations
        .filter(
          (op) => op.investmentId === inv.id && op.operationType === "dividend",
        )
        .sort(
          (a, b) =>
            new Date(b.operationDate).getTime() -
            new Date(a.operationDate).getTime(),
        )[0];

      if (!lastDividend) return null;

      const nextDate = new Date(lastDividend.operationDate);
      nextDate.setMonth(nextDate.getMonth() + 3); // Assumir pagamento trimestral

      return {
        investmentId: inv.id,
        identifier: inv.identifier,
        name: inv.name || inv.identifier,
        expectedDate: nextDate,
        estimatedValue: lastDividend.totalValue,
        confidence: "medium" as const,
        lastPayment: new Date(lastDividend.operationDate),
      };
    })
    .filter(Boolean) as DividendPayment[];
}

function generateMonthlyHistory(
  operations: InvestmentOperation[],
): MonthlyDividend[] {
  const monthlyMap = new Map<string, MonthlyDividend>();

  operations.forEach((op) => {
    const date = new Date(op.operationDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthName = date.toLocaleDateString("pt-BR", { month: "long" });

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        month: monthName,
        year: date.getFullYear(),
        total: 0,
        count: 0,
        assets: [],
      });
    }

    const monthData = monthlyMap.get(key)!;
    monthData.total += op.totalValue;
    monthData.count += 1;

    // Adicionar ativo se não existir
    const existingAsset = monthData.assets.find(
      (a) => a.identifier === op.investmentId,
    );
    if (existingAsset) {
      existingAsset.value += op.totalValue;
    } else {
      monthData.assets.push({
        identifier: op.investmentId,
        value: op.totalValue,
      });
    }
  });

  return Array.from(monthlyMap.values()).sort(
    (a, b) => b.year - a.year || b.month.localeCompare(a.month),
  );
}

function generateAssetBreakdown(
  investments: Investment[],
  operations: InvestmentOperation[],
): AssetDividendBreakdown[] {
  const assetMap = new Map<string, AssetDividendBreakdown>();
  const totalDividends = operations.reduce((sum, op) => sum + op.totalValue, 0);

  investments.forEach((inv) => {
    const assetOperations = operations.filter(
      (op) => op.investmentId === inv.id,
    );
    if (assetOperations.length === 0) return;

    const totalReceived = assetOperations.reduce(
      (sum, op) => sum + op.totalValue,
      0,
    );
    const percentage =
      totalDividends > 0 ? (totalReceived / totalDividends) * 100 : 0;
    const yieldPercentage =
      inv.totalInvested > 0 ? (totalReceived / inv.totalInvested) * 100 : 0;
    const frequency = assetOperations.length; // Simplificado

    // Calcular tendência (simplificado)
    const sortedOps = assetOperations.sort(
      (a, b) =>
        new Date(a.operationDate).getTime() -
        new Date(b.operationDate).getTime(),
    );
    const trend =
      sortedOps.length > 1 &&
      sortedOps[sortedOps.length - 1].totalValue > sortedOps[0].totalValue
        ? "up"
        : "stable";

    assetMap.set(inv.id, {
      investmentId: inv.id,
      identifier: inv.identifier,
      name: inv.name || inv.identifier,
      totalReceived,
      percentage,
      yieldPercentage,
      frequency,
      lastPayment:
        sortedOps.length > 0
          ? new Date(sortedOps[sortedOps.length - 1].operationDate)
          : undefined,
      trend,
    });
  });

  return Array.from(assetMap.values()).sort(
    (a, b) => b.totalReceived - a.totalReceived,
  );
}
