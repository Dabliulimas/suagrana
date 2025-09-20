"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { CashFlowProjection, RecurringBill } from "../types";

interface CashFlowProjectionsProps {
  onUpdate?: () => void;
}

export function CashFlowProjections({ onUpdate }: CashFlowProjectionsProps) {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<
    "optimistic" | "realistic" | "pessimistic"
  >("realistic");
  const [selectedPeriod, setSelectedPeriod] = useState("6-months");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadProjections();
  }, []);

  const loadProjections = () => {
    const savedProjections = localStorage.getItem("cashFlowProjections");
    if (typeof window === "undefined") return;
    if (typeof window === "undefined") return;
    if (savedProjections) {
      setProjections(JSON.parse(savedProjections));
    } else {
      generateProjections();
    }
  };

  const generateProjections = async () => {
    setIsGenerating(true);

    try {
      // Get historical data
      const transactions = transactions;
      const recurringBills = JSON.parse(
        localStorage.getItem("recurringBills") || "[]",
      ) as RecurringBill[];
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;

      // Calculate historical averages
      const last6Months = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return transactionDate >= sixMonthsAgo;
      });

      const monthlyIncome =
        last6Months
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0) / 6;

      const monthlyExpenses =
        last6Months
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 6;

      // Add recurring bills
      const monthlyRecurringExpenses = recurringBills
        .filter((bill) => bill.isActive)
        .reduce((sum, bill) => {
          switch (bill.frequency) {
            case "weekly":
              return sum + bill.amount * 4.33;
            case "monthly":
              return sum + bill.amount;
            case "quarterly":
              return sum + bill.amount / 3;
            case "yearly":
              return sum + bill.amount / 12;
            default:
              return sum;
          }
        }, 0);

      const totalMonthlyExpenses = monthlyExpenses + monthlyRecurringExpenses;

      // Generate projections for next 12 months
      const newProjections: CashFlowProjection[] = [];
      let currentBalance = storage
        .getAccounts()
        .reduce((sum, acc) => sum + acc.balance, 0);

      for (let i = 0; i < 12; i++) {
        const projectionDate = new Date();
        projectionDate.setMonth(projectionDate.getMonth() + i + 1);
        const month = projectionDate.toISOString().slice(0, 7);

        // Scenario multipliers
        const scenarios = {
          optimistic: { income: 1.1, expenses: 0.9 },
          realistic: { income: 1.0, expenses: 1.0 },
          pessimistic: { income: 0.9, expenses: 1.1 },
        };

        Object.entries(scenarios).forEach(([scenario, multipliers]) => {
          const projectedIncome = monthlyIncome * multipliers.income;
          const projectedExpenses = totalMonthlyExpenses * multipliers.expenses;
          const projectedBalance = projectedIncome - projectedExpenses;

          currentBalance += projectedBalance;

          const confidence =
            scenario === "realistic" ? 85 : scenario === "optimistic" ? 70 : 75;

          newProjections.push({
            id: `${month}-${scenario}`,
            month,
            projectedIncome,
            projectedExpenses,
            projectedBalance,
            scenario: scenario as "optimistic" | "realistic" | "pessimistic",
            confidence,
            factors: [
              {
                type: "income",
                category: "Salário",
                amount: projectedIncome * 0.8,
                probability: 95,
                description: "Salário mensal baseado no histórico",
              },
              {
                type: "expense",
                category: "Contas Fixas",
                amount: monthlyRecurringExpenses,
                probability: 100,
                description: "Contas recorrentes cadastradas",
              },
              {
                type: "expense",
                category: "Gastos Variáveis",
                amount: monthlyExpenses,
                probability: 80,
                description: "Baseado na média dos últimos 6 meses",
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      }

      localStorage.setItem(
        "cashFlowProjections",
        JSON.stringify(newProjections),
      );
      setProjections(newProjections);
    } catch (error) {
      logComponents.error("Error generating projections:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getFilteredProjections = () => {
    let filtered = projections.filter((p) => p.scenario === selectedScenario);

    const monthsToShow =
      selectedPeriod === "3-months"
        ? 3
        : selectedPeriod === "6-months"
          ? 6
          : 12;
    return filtered.slice(0, monthsToShow);
  };

  const getScenarioComparison = () => {
    const months = Array.from(new Set(projections.map((p) => p.month))).slice(
      0,
      6,
    );

    return months.map((month) => {
      const optimistic = projections.find(
        (p) => p.month === month && p.scenario === "optimistic",
      );
      const realistic = projections.find(
        (p) => p.month === month && p.scenario === "realistic",
      );
      const pessimistic = projections.find(
        (p) => p.month === month && p.scenario === "pessimistic",
      );

      return {
        month: new Date(month + "-01").toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
        optimistic: optimistic?.projectedBalance || 0,
        realistic: realistic?.projectedBalance || 0,
        pessimistic: pessimistic?.projectedBalance || 0,
      };
    });
  };

  const getProjectionSummary = () => {
    const filtered = getFilteredProjections();
    const totalIncome = filtered.reduce((sum, p) => sum + p.projectedIncome, 0);
    const totalExpenses = filtered.reduce(
      (sum, p) => sum + p.projectedExpenses,
      0,
    );
    const totalBalance = totalIncome - totalExpenses;
    const averageConfidence =
      filtered.reduce((sum, p) => sum + p.confidence, 0) / filtered.length;

    return {
      totalIncome,
      totalExpenses,
      totalBalance,
      averageConfidence,
      months: filtered.length,
    };
  };

  const getInsights = () => {
    const filtered = getFilteredProjections();
    const insights = [];

    // Check for negative months
    const negativeMonths = filtered.filter((p) => p.projectedBalance < 0);
    if (negativeMonths.length > 0) {
      insights.push({
        type: "warning" as const,
        title: "Meses com Saldo Negativo",
        description: `${negativeMonths.length} meses com saldo negativo projetado`,
        impact: "negative" as const,
      });
    }

    // Check for growth trend
    const firstMonth = filtered[0];
    const lastMonth = filtered[filtered.length - 1];
    if (
      lastMonth &&
      firstMonth &&
      lastMonth.projectedBalance > firstMonth.projectedBalance
    ) {
      insights.push({
        type: "opportunity" as const,
        title: "Tendência de Crescimento",
        description: "Saldo projetado em crescimento ao longo do período",
        impact: "positive" as const,
      });
    }

    // Check for high expenses
    const avgExpenseRatio =
      filtered.reduce(
        (sum, p) => sum + p.projectedExpenses / p.projectedIncome,
        0,
      ) / filtered.length;
    if (avgExpenseRatio > 0.8) {
      insights.push({
        type: "warning" as const,
        title: "Gastos Elevados",
        description: `Gastos representam ${(avgExpenseRatio * 100).toFixed(1)}% da receita`,
        impact: "negative" as const,
      });
    }

    return insights;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getScenarioColor = (scenario: string) => {
    const colors = {
      optimistic: "#10B981",
      realistic: "#3B82F6",
      pessimistic: "#EF4444",
    };
    return colors[scenario as keyof typeof colors] || "#6B7280";
  };

  const getScenarioLabel = (scenario: string) => {
    const labels = {
      optimistic: "Otimista",
      realistic: "Realista",
      pessimistic: "Pessimista",
    };
    return labels[scenario as keyof typeof labels] || scenario;
  };

  const filteredProjections = getFilteredProjections();
  const scenarioComparison = getScenarioComparison();
  const summary = getProjectionSummary();
  const insights = getInsights();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Projeção de Fluxo de Caixa
          </h3>
          <p className="text-sm text-gray-600">
            Visualize e analise projeções financeiras para os próximos meses
          </p>
        </div>
        <Button
          onClick={generateProjections}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isGenerating ? "Gerando..." : "Atualizar Projeções"}
        </Button>
      </div>

      {/* Controles */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium">Cenário</label>
          <Select
            value={selectedScenario}
            onValueChange={(value: any) => setSelectedScenario(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="optimistic">Otimista</SelectItem>
              <SelectItem value="realistic">Realista</SelectItem>
              <SelectItem value="pessimistic">Pessimista</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Período</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3-months">3 Meses</SelectItem>
              <SelectItem value="6-months">6 Meses</SelectItem>
              <SelectItem value="12-months">12 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Receita Projetada</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </p>
            <p className="text-xs text-gray-500">{summary.months} meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Despesas Projetadas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses)}
            </p>
            <p className="text-xs text-gray-500">{summary.months} meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign
                className={`w-4 h-4 ${summary.totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
              />
              <span className="text-sm text-gray-600">Saldo Projetado</span>
            </div>
            <p
              className={`text-2xl font-bold ${summary.totalBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="text-xs text-gray-500">{summary.months} meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Confiança</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {summary.averageConfidence.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">
              Cenário {getScenarioLabel(selectedScenario).toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Insights e Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {insight.impact === "positive" ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm text-gray-600">
                      {insight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
          <TabsTrigger value="comparison">Comparação de Cenários</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Fluxo de Caixa Projetado - {getScenarioLabel(selectedScenario)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={filteredProjections.map((p) => ({
                    month: new Date(p.month + "-01").toLocaleDateString(
                      "pt-BR",
                      { month: "short", year: "2-digit" },
                    ),
                    receita: p.projectedIncome,
                    despesas: p.projectedExpenses,
                    saldo: p.projectedBalance,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Receita"
                  />
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.6}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    name="Saldo"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Cenários</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={scenarioComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                      "",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="optimistic"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Otimista"
                  />
                  <Line
                    type="monotone"
                    dataKey="realistic"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Realista"
                  />
                  <Line
                    type="monotone"
                    dataKey="pessimistic"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Pessimista"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4">
            {filteredProjections.map((projection) => (
              <Card key={projection.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {new Date(projection.month + "-01").toLocaleDateString(
                        "pt-BR",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      style={{ color: getScenarioColor(projection.scenario) }}
                    >
                      {getScenarioLabel(projection.scenario)} •{" "}
                      {projection.confidence}% confiança
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600">
                        Receita Projetada
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(projection.projectedIncome)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600">
                        Despesas Projetadas
                      </p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(projection.projectedExpenses)}
                      </p>
                    </div>
                    <div
                      className={`text-center p-4 rounded-lg ${
                        projection.projectedBalance >= 0
                          ? "bg-blue-50"
                          : "bg-orange-50"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          projection.projectedBalance >= 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        Saldo Projetado
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          projection.projectedBalance >= 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                      >
                        {formatCurrency(projection.projectedBalance)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Fatores Considerados:</h4>
                    <div className="space-y-2">
                      {projection.factors.map((factor, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {factor.description}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                factor.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(factor.amount)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {factor.probability}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
