"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  Lightbulb,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type { Transaction, Account } from "../lib/storage";
import {
  CustomDateFilter,
  filterByPeriod,
} from "./ui/custom-date-filter";

interface BudgetInsightsProps {
  onUpdate?: () => void;
}

interface CategoryBudget {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "exceeded";
  trend: "up" | "down" | "stable";
}

interface FinancialInsight {
  id: string;
  type: "tip" | "warning" | "achievement" | "opportunity";
  title: string;
  description: string;
  action?: string;
  priority: "high" | "medium" | "low";
}

export function BudgetInsights({ onUpdate }: BudgetInsightsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(false);
  const [isBudgetExpanded, setIsBudgetExpanded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    loadBudgetData();
    generateInsights();
  }, [selectedPeriod]);

  const loadBudgetData = () => {
    try {
      const transactions = transactions;
      const accounts = accounts;

      // Get filtered transactions based on selected period
      const filteredTransactions = filterByPeriod(
        transactions,
        selectedPeriod,
        customStartDate,
        customEndDate,
      );

      // Calculate category spending
      const categorySpending: Record<string, number> = {};
      let totalExpenses = 0;
      let totalIncome = 0;

      filteredTransactions.forEach((t) => {
        if (t.type === "expense") {
          categorySpending[t.category] =
            (categorySpending[t.category] || 0) + Math.abs(t.amount);
          totalExpenses += Math.abs(t.amount);
        } else if (t.type === "income") {
          totalIncome += t.amount;
        }
      });

      // Get budget data from localStorage or create defaults based on spending
      const currentDate = new Date();
      const currentMonthStr = (currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const currentYearStr = currentDate.getFullYear().toString();

      const savedBudgets = localStorage.getItem(
        `sua-grana-budget-${currentYearStr}-${currentMonthStr}`,
      );
      if (typeof window === "undefined") return;
      let budgetLimits: Record<string, number> = {};

      if (savedBudgets) {
        const budgetData = JSON.parse(savedBudgets);
        budgetData.forEach((category: any) => {
          budgetLimits[category.name] = category.budgeted;
        });
      } else {
        // Create default budgets based on current spending patterns
        Object.keys(categorySpending).forEach((category) => {
          budgetLimits[category] = Math.ceil(categorySpending[category] * 1.2); // 20% buffer
        });
      }

      const budgets: CategoryBudget[] = Object.entries(budgetLimits).map(
        ([category, budgeted]) => {
          const spent = categorySpending[category] || 0;
          const remaining = budgeted - spent;
          const percentage = (spent / budgeted) * 100;

          let status: "good" | "warning" | "exceeded" = "good";
          if (percentage > 100) status = "exceeded";
          else if (percentage > 80) status = "warning";

          return {
            category,
            budgeted,
            spent,
            remaining,
            percentage: Math.min(percentage, 100),
            status,
            trend: "stable", // In a real app, this would be calculated from historical data
          };
        },
      );

      setCategoryBudgets(budgets);
      setTotalBudget(Object.values(budgetLimits).reduce((a, b) => a + b, 0));
      setTotalSpent(totalExpenses);
      setSavingsRate(
        totalIncome > 0
          ? ((totalIncome - totalExpenses) / totalIncome) * 100
          : 0,
      );
    } catch (error) {
      logComponents.error("Error loading budget data:", error);
    }
  };

  const generateInsights = () => {
    const newInsights: FinancialInsight[] = [];

    // Budget performance insights
    const exceededBudgets = categoryBudgets.filter(
      (b) => b.status === "exceeded",
    );
    const warningBudgets = categoryBudgets.filter(
      (b) => b.status === "warning",
    );
    const goodBudgets = categoryBudgets.filter((b) => b.status === "good");

    if (exceededBudgets.length > 0) {
      newInsights.push({
        id: "exceeded-budget",
        type: "warning",
        title: "Orçamento Excedido",
        description: `Você excedeu o orçamento em ${exceededBudgets.length} categoria(s): ${exceededBudgets.map((b) => b.category).join(", ")}.`,
        action: "Revisar gastos nessas categorias",
        priority: "high",
      });
    }

    if (warningBudgets.length > 0) {
      newInsights.push({
        id: "warning-budget",
        type: "warning",
        title: "Atenção ao Orçamento",
        description: `${warningBudgets.length} categoria(s) estão próximas do limite: ${warningBudgets.map((b) => b.category).join(", ")}.`,
        action: "Monitorar gastos até o fim do mês",
        priority: "medium",
      });
    }

    if (savingsRate > 20) {
      newInsights.push({
        id: "good-savings",
        type: "achievement",
        title: "Excelente Taxa de Poupança!",
        description: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda. Parabéns!`,
        priority: "low",
      });
    } else if (savingsRate < 10) {
      newInsights.push({
        id: "low-savings",
        type: "opportunity",
        title: "Oportunidade de Poupança",
        description: `Sua taxa de poupança é de ${savingsRate.toFixed(1)}%. Considere reduzir gastos em algumas categorias.`,
        action: "Definir meta de poupança de 20%",
        priority: "medium",
      });
    }

    // Spending pattern insights
    const topSpendingCategory = categoryBudgets.reduce(
      (max, current) => (current.spent > max.spent ? current : max),
      categoryBudgets[0],
    );

    if (topSpendingCategory && topSpendingCategory.spent > 0) {
      newInsights.push({
        id: "top-spending",
        type: "tip",
        title: "Maior Gasto do Mês",
        description: `Sua maior despesa é em ${topSpendingCategory.category}: R$ ${topSpendingCategory.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`,
        action: "Analisar oportunidades de economia",
        priority: "low",
      });
    }

    setInsights(newInsights);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "tip":
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "achievement":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "opportunity":
        return <Target className="w-5 h-5 text-purple-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "exceeded":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Insights de Orçamento
          </h2>
          <p className="text-gray-600">
            Análises inteligentes e recomendações para otimizar seus gastos
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Calendar className="w-4 h-4 mr-2" />
          Filtros de Data
        </Button>
      </div>

      {/* Custom Date Filter */}
      {showFilters && (
        <CustomDateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Orçamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R${" "}
              {totalBudget.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              Total Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R${" "}
              {totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {(totalBudget - totalSpent).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Taxa de Poupança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${savingsRate >= 20 ? "text-green-600" : savingsRate >= 10 ? "text-yellow-600" : "text-red-600"}`}
            >
              {savingsRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Insights Inteligentes
              <Badge variant="secondary">{insights.length}</Badge>
            </CardTitle>
            {insights.length > 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="h-8 w-8 p-0"
              >
                {isInsightsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum insight disponível no momento
            </p>
          ) : (
            <div className="space-y-3">
              {(isInsightsExpanded ? insights : insights.slice(0, 2)).map((insight) => (
                <div
                  key={insight.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  {getInsightIcon(insight.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          insight.priority === "high"
                            ? "border-red-200 text-red-700"
                            : insight.priority === "medium"
                              ? "border-yellow-200 text-yellow-700"
                              : "border-gray-200 text-gray-700"
                        }`}
                      >
                        {insight.priority === "high"
                          ? "Alta"
                          : insight.priority === "medium"
                            ? "Média"
                            : "Baixa"}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <p className="text-blue-600 text-sm font-medium">
                        💡 {insight.action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {insights.length > 2 && !isInsightsExpanded && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsInsightsExpanded(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 h-8"
                  >
                    Ver mais {insights.length - 2} insight(s)
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Performance do Orçamento por Categoria
              <Badge variant="secondary">{categoryBudgets.length}</Badge>
            </CardTitle>
            {categoryBudgets.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBudgetExpanded(!isBudgetExpanded)}
                className="h-8 w-8 p-0"
              >
                {isBudgetExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {categoryBudgets.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum dado de orçamento disponível
            </p>
          ) : (
            <div className="space-y-4">
              {(isBudgetExpanded ? categoryBudgets : categoryBudgets.slice(0, 3)).map((budget) => (
                <div key={budget.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{budget.category}</span>
                      <Badge className={getStatusColor(budget.status)}>
                        {budget.status === "good"
                          ? "No limite"
                          : budget.status === "warning"
                            ? "Atenção"
                            : "Excedido"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        R${" "}
                        {budget.spent.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        / R${" "}
                        {budget.budgeted.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          budget.remaining >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {budget.remaining >= 0 ? "Restam" : "Excedeu"} R${" "}
                        {Math.abs(budget.remaining).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                  <Progress
                    value={budget.percentage}
                    className={`h-3 ${
                      budget.status === "exceeded"
                        ? "[&>div]:bg-red-500"
                        : budget.status === "warning"
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-green-500"
                    }`}
                  />
                  <div className="text-xs text-gray-500">
                    {budget.percentage.toFixed(1)}% do orçamento utilizado
                  </div>
                </div>
              ))}
              {categoryBudgets.length > 3 && !isBudgetExpanded && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsBudgetExpanded(true)}
                    className="text-xs text-gray-500 hover:text-gray-700 h-8"
                  >
                    Ver mais {categoryBudgets.length - 3} categoria(s)
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
