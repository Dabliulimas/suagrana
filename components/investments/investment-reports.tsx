"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Target,
  AlertTriangle,
  Award,
  DollarSign,
  Percent,
  Activity,
} from "lucide-react";
import { useInvestments } from "../../contexts/unified-context";
import { useSafeTheme } from "../../hooks/use-safe-theme";
import { AssetType } from "../../lib/types/investments";
import {
  formatCurrency,
  formatPercentage,
  calculatePerformanceMetrics,
  calculateCurrentValue,
} from "../../lib/utils/investment-calculations";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvestmentReportsProps {
  className?: string;
}

type ReportPeriod = "3m" | "6m" | "1y" | "2y" | "all";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
  "#00ffff",
  "#ff0000",
  "#0000ff",
  "#ffff00",
];

const getAssetTypeLabel = (type: AssetType) => {
  const labels = {
    stock: "Ações",
    fii: "FIIs",
    etf: "ETFs",
    crypto: "Criptos",
    fixed_income: "Renda Fixa",
    other: "Outros",
  };
  return labels[type] || type;
};

export function InvestmentReports({ className }: InvestmentReportsProps) {
  const { investments } = useInvestments();
  const { settings } = useSafeTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("1y");
  const [selectedTab, setSelectedTab] = useState("overview");

  // Calcular período de análise
  const getPeriodDates = (period: ReportPeriod) => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "3m":
        startDate = subMonths(now, 3);
        break;
      case "6m":
        startDate = subMonths(now, 6);
        break;
      case "1y":
        startDate = subMonths(now, 12);
        break;
      case "2y":
        startDate = subMonths(now, 24);
        break;
      case "all":
      default:
        // Encontrar a primeira operação - simplificado
        const allOperations = (investments || []).map(inv => ({ date: inv.purchaseDate || new Date().toISOString() }));
        if (allOperations.length === 0) {
          startDate = subMonths(now, 12);
        } else {
          const firstOperation = allOperations.reduce((earliest, op) =>
            new Date(op.date) < new Date(earliest.date) ? op : earliest,
          );
          startDate = new Date(firstOperation.date);
        }
        break;
    }

    return { startDate, endDate: now };
  };

  const { startDate, endDate } = getPeriodDates(selectedPeriod);

  // Filtrar operações do período - simplificado
  const periodOperations = useMemo(() => {
    return (investments || []).map((investment) => ({
      id: investment.id,
      type: "buy" as const,
      date: investment.purchaseDate || new Date().toISOString(),
      totalValue: (investment.quantity || 0) * (investment.purchasePrice || 0),
      netValue: (investment.quantity || 0) * (investment.purchasePrice || 0),
      investmentTicker: investment.symbol,
      investmentName: investment.name,
      assetType: investment.type,
      brokerName: investment.broker || "Corretora",
      brokerColor: "#666666",
    }));
  }, [investments, startDate, endDate]);

  // Métricas gerais
  const overviewMetrics = useMemo(() => {
    const activeInvestments = (investments || []).filter(
      (inv) => inv.status === "active",
    );
    const totalInvested = activeInvestments.reduce(
      (sum, inv) => sum + ((inv.quantity || 0) * (inv.purchasePrice || 0)),
      0,
    );
    const currentValue = activeInvestments.reduce(
      (sum, inv) => sum + ((inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0)),
      0,
    );
    const totalResult = currentValue - totalInvested;
    const totalResultPercent =
      totalInvested > 0 ? (totalResult / totalInvested) * 100 : 0;

    const buyOperations = periodOperations.filter((op) => op.type === "buy");
    const sellOperations = periodOperations.filter((op) => op.type === "sell");
    const periodInvested = buyOperations.reduce(
      (sum, op) => sum + op.totalValue,
      0,
    );
    const periodReceived = sellOperations.reduce(
      (sum, op) => sum + op.netValue,
      0,
    );
    const periodResult = sellOperations.reduce(
      (sum, op) => sum + (op.result || 0),
      0,
    );

    const uniqueAssets = new Set(activeInvestments.map((inv) => inv.symbol || inv.name))
      .size;
    const uniqueBrokers = new Set(activeInvestments.map((inv) => inv.broker))
      .size;

    return {
      totalInvestments: activeInvestments.length,
      uniqueAssets,
      uniqueBrokers,
      totalInvested,
      currentValue,
      totalResult,
      totalResultPercent,
      periodOperations: periodOperations.length,
      periodInvested,
      periodReceived,
      periodResult,
    };
  }, [investments, periodOperations]);

  // Distribuição por tipo de ativo
  const assetTypeDistribution = useMemo(() => {
    const activeInvestments = (investments || []).filter(
      (inv) => inv.status === "active",
    );
    const distribution = activeInvestments.reduce(
      (acc, inv) => {
        const value = (inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0);
        const assetType = inv.type as AssetType || 'other';
        acc[assetType] = (acc[assetType] || 0) + value;
        return acc;
      },
      {} as Record<AssetType, number>,
    );

    const total = Object.values(distribution).reduce(
      (sum, value) => sum + value,
      0,
    );

    return Object.entries(distribution).map(([type, value], index) => ({
      name: getAssetTypeLabel(type as AssetType),
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [investments]);

  // Distribuição por corretora
  const brokerDistribution = useMemo(() => {
    const activeInvestments = (investments || []).filter(
      (inv) => inv.status === "active",
    );
    const distribution = activeInvestments.reduce(
      (acc, inv) => {
        const brokerName = inv.broker || "Corretora";
        const value = (inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0);
        acc[brokerName] = (acc[brokerName] || 0) + value;
        return acc;
      },
      {} as Record<string, number>,
    );

    const total = Object.values(distribution).reduce(
      (sum, value) => sum + value,
      0,
    );

    return Object.entries(distribution).map(([name, value], index) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [investments]);

  // Evolução mensal
  const monthlyEvolution = useMemo(() => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthOperations = periodOperations.filter((op) => {
        const opDate = new Date(op.date);
        return opDate >= monthStart && opDate <= monthEnd;
      });

      const invested = monthOperations
        .filter((op) => op.type === "buy")
        .reduce((sum, op) => sum + op.totalValue, 0);

      const received = monthOperations
        .filter((op) => op.type === "sell")
        .reduce((sum, op) => sum + op.netValue, 0);

      const result = monthOperations
        .filter((op) => op.type === "sell")
        .reduce((sum, op) => sum + (op.result || 0), 0);

      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        invested,
        received,
        result,
        netFlow: invested - received,
      };
    });
  }, [periodOperations, startDate, endDate]);

  // Top investimentos
  const topInvestments = useMemo(() => {
    return (investments || [])
      .filter((inv) => inv.status === "active")
      .map((inv) => {
        const currentValue = (inv.quantity || 0) * (inv.currentPrice || inv.purchasePrice || 0);
        const totalInvested = (inv.quantity || 0) * (inv.purchasePrice || 0);
        const result = currentValue - totalInvested;
        const resultPercent =
          totalInvested > 0 ? (result / totalInvested) * 100 : 0;
        const brokerName = inv.broker || "Corretora";

        return {
          ...inv,
          currentValue,
          totalInvested,
          result,
          resultPercent,
          brokerName,
          brokerColor: "#666666",
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10);
  }, [investments]);

  // Alertas e recomendações
  const alerts = useMemo(() => {
    const alerts: Array<{
      type: "warning" | "info" | "success";
      title: string;
      description: string;
      icon: React.ElementType;
    }> = [];

    // Concentração em um único ativo
    const totalValue = overviewMetrics.currentValue;
    const concentratedAssets = topInvestments.filter(
      (inv) => inv.currentValue / totalValue > 0.3,
    );

    if (concentratedAssets.length > 0) {
      alerts.push({
        type: "warning",
        title: "Alta Concentração",
        description: `${concentratedAssets[0].name || concentratedAssets[0].symbol} representa ${formatPercentage((concentratedAssets[0].currentValue / totalValue) * 100)} da carteira`,
        icon: AlertTriangle,
      });
    }

    // Performance positiva
    if (overviewMetrics.totalResultPercent > 10) {
      alerts.push({
        type: "success",
        title: "Boa Performance",
        description: `Carteira com rentabilidade de ${formatPercentage(overviewMetrics.totalResultPercent)}`,
        icon: Award,
      });
    }

    // Diversificação
    if (overviewMetrics.uniqueAssets < 5) {
      alerts.push({
        type: "info",
        title: "Diversificação",
        description:
          "Considere diversificar em mais ativos para reduzir riscos",
        icon: Target,
      });
    }

    return alerts;
  }, [overviewMetrics, topInvestments]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3
                className={`h-5 w-5 ${settings.colorfulIcons ? "text-purple-600" : "text-muted-foreground"}`}
              />
              <CardTitle>Relatórios de Investimentos</CardTitle>
            </div>
            <Select
              value={selectedPeriod}
              onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
                <SelectItem value="2y">Últimos 2 anos</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="distribution">Distribuição</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analysis">Análise</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Métricas principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Valor Total
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(overviewMetrics.currentValue)}
                        </p>
                      </div>
                      <DollarSign
                        className={`h-8 w-8 ${settings.colorfulIcons ? "text-green-600" : "text-muted-foreground"}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Resultado
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            overviewMetrics.totalResult >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(overviewMetrics.totalResult)}
                        </p>
                      </div>
                      {overviewMetrics.totalResult >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Rentabilidade
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            overviewMetrics.totalResultPercent >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatPercentage(overviewMetrics.totalResultPercent)}
                        </p>
                      </div>
                      <Percent
                        className={`h-8 w-8 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Ativos
                        </p>
                        <p className="text-2xl font-bold">
                          {overviewMetrics.uniqueAssets}
                        </p>
                      </div>
                      <Activity
                        className={`h-8 w-8 ${settings.colorfulIcons ? "text-orange-600" : "text-muted-foreground"}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alertas */}
              {alerts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">
                    Alertas e Recomendações
                  </h3>
                  <div className="grid gap-3">
                    {alerts.map((alert, index) => {
                      const Icon = alert.icon;
                      return (
                        <Card
                          key={index}
                          className={`border-l-4 ${
                            alert.type === "warning"
                              ? "border-l-yellow-500"
                              : alert.type === "success"
                                ? "border-l-green-500"
                                : "border-l-blue-500"
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Icon
                                className={`h-5 w-5 mt-0.5 ${
                                  alert.type === "warning"
                                    ? "text-yellow-500"
                                    : alert.type === "success"
                                      ? "text-green-500"
                                      : "text-blue-500"
                                }`}
                              />
                              <div>
                                <h4 className="font-medium">{alert.title}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {alert.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Top investimentos */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium">
                  Principais Investimentos
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="space-y-2 p-4">
                      {topInvestments.slice(0, 5).map((investment, index) => (
                        <div
                          key={investment.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-lg font-bold text-muted-foreground">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="font-medium">
                                {investment.identifier}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: investment.brokerColor,
                                  }}
                                />
                                {investment.brokerName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(investment.currentValue)}
                            </div>
                            <div
                              className={`text-sm ${
                                investment.result >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(investment.result)} (
                              {formatPercentage(investment.resultPercent)})
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Distribuição por tipo de ativo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon
                        className={`h-5 w-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                      />
                      Por Tipo de Ativo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetTypeDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) =>
                              `${name} (${formatPercentage(percentage)})`
                            }
                          >
                            {assetTypeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribuição por corretora */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon
                        className={`h-5 w-5 ${settings.colorfulIcons ? "text-blue-600" : "text-muted-foreground"}`}
                      />
                      Por Corretora
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={brokerDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) =>
                              `${name} (${formatPercentage(percentage)})`
                            }
                          >
                            {brokerDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Evolução mensal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar
                      className={`h-5 w-5 ${settings.colorfulIcons ? "text-purple-600" : "text-muted-foreground"}`}
                    />
                    Evolução Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyEvolution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          tickFormatter={(value: number) =>
                            formatCurrency(value)
                          }
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="invested"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          name="Investido"
                        />
                        <Area
                          type="monotone"
                          dataKey="received"
                          stackId="2"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          name="Recebido"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <div className="grid gap-6">
                {/* Métricas do período */}
                <Card>
                  <CardHeader>
                    <CardTitle>Análise do Período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {overviewMetrics.periodOperations}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Operações
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatCurrency(overviewMetrics.periodInvested)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Investido
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {formatCurrency(overviewMetrics.periodReceived)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Recebido
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${
                            overviewMetrics.periodResult >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(overviewMetrics.periodResult)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Resultado
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recomendações */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recomendações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Diversificação</h4>
                        <p className="text-sm text-muted-foreground">
                          Sua carteira possui {overviewMetrics.uniqueAssets}{" "}
                          ativos diferentes.
                          {overviewMetrics.uniqueAssets < 10
                            ? " Considere aumentar a diversificação para reduzir riscos."
                            : " Boa diversificação de ativos."}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Performance</h4>
                        <p className="text-sm text-muted-foreground">
                          {overviewMetrics.totalResultPercent >= 0
                            ? `Sua carteira está com performance positiva de ${formatPercentage(overviewMetrics.totalResultPercent)}. Continue acompanhando os resultados.`
                            : `Sua carteira está com performance negativa de ${formatPercentage(overviewMetrics.totalResultPercent)}. Revise sua estratégia de investimentos.`}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Corretoras</h4>
                        <p className="text-sm text-muted-foreground">
                          Você utiliza {overviewMetrics.uniqueBrokers}{" "}
                          corretora(s) diferentes.
                          {overviewMetrics.uniqueBrokers === 1
                            ? " Considere diversificar entre corretoras para reduzir riscos operacionais."
                            : " Boa distribuição entre corretoras."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
