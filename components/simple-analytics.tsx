"use client";

import { useState, useEffect } from "react";
import { useTransactions, useAccounts } from "../contexts/unified-context";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

interface AnalyticsData {
  monthlyData: MonthlyData[];
  topCategories: CategoryData[];
  trends: {
    income: number;
    expenses: number;
  };
  totalTransactions: number;
  averageTransaction: number;
}

export function SimpleAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const loading = transactionsLoading || accountsLoading;

  useEffect(() => {
    if (transactions.length === 0) return;

    // Calcular análises baseadas nas transações
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = transactions.filter(
      (t) => new Date(t.date) >= sixMonthsAgo,
    );

    // Análise por mês
    const monthlyData = recentTransactions.reduce(
      (acc, transaction) => {
        const month = transaction.date.slice(0, 7);
        if (!acc[month]) {
          acc[month] = { income: 0, expenses: 0, balance: 0 };
        }

        if (transaction.type === "income") {
          acc[month].income += Math.abs(transaction.amount);
        } else {
          acc[month].expenses += Math.abs(transaction.amount);
        }
        acc[month].balance = acc[month].income - acc[month].expenses;

        return acc;
      },
      {} as Record<
        string,
        { income: number; expenses: number; balance: number }
      >,
    );

    // Análise por categoria
    const categoryData = recentTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce(
        (acc, transaction) => {
          const category = transaction.category;
          acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

    // Top 5 categorias
    const topCategories = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Tendências
    const months = Object.keys(monthlyData).sort();
    const trends = {
      income:
        months.length > 1
          ? ((monthlyData[months[months.length - 1]].income -
              monthlyData[months[months.length - 2]].income) /
              monthlyData[months[months.length - 2]].income) *
            100
          : 0,
      expenses:
        months.length > 1
          ? ((monthlyData[months[months.length - 1]].expenses -
              monthlyData[months[months.length - 2]].expenses) /
              monthlyData[months[months.length - 2]].expenses) *
            100
          : 0,
    };

    const analyticsData = {
      monthlyData: months.map((month) => ({
        month,
        ...monthlyData[month],
      })),
      topCategories,
      trends,
      totalTransactions: recentTransactions.length,
      averageTransaction:
        recentTransactions.length > 0
          ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) /
            recentTransactions.length
          : 0,
    };

    setAnalytics(analyticsData);
  }, [transactions]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Erro ao carregar análises
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMonth = analytics.monthlyData[analytics.monthlyData.length - 1];
  const totalExpenses = analytics.topCategories.reduce(
    (sum, cat) => sum + cat.amount,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Transações
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalTransactions}
            </div>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transação Média
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R${" "}
              {analytics.averageTransaction.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">Por transação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${currentMonth?.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${currentMonth?.balance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R${" "}
              {Math.abs(currentMonth?.balance || 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth?.balance >= 0 ? "Superávit" : "Déficit"} mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências Mensais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                {analytics.trends.income >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={
                    analytics.trends.income >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {Math.abs(analytics.trends.income).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Despesas</span>
              </div>
              <div className="flex items-center gap-2">
                {analytics.trends.expenses >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
                <span
                  className={
                    analytics.trends.expenses >= 0
                      ? "text-red-600"
                      : "text-green-600"
                  }
                >
                  {Math.abs(analytics.trends.expenses).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Top Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => {
                const percentage =
                  totalExpenses > 0
                    ? (category.amount / totalExpenses) * 100
                    : 0;
                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0
                              ? "bg-red-500"
                              : index === 1
                                ? "bg-orange-500"
                                : index === 2
                                  ? "bg-yellow-500"
                                  : index === 3
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                          }`}
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        R${" "}
                        {category.amount.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% do total
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyData.slice(-6).map((month) => (
              <div
                key={month.month}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {new Date(month.month + "-01").toLocaleDateString("pt-BR", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receitas: R${" "}
                    {month.income.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    | Despesas: R${" "}
                    {month.expenses.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div
                  className={`text-right ${month.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  <p className="font-semibold">
                    R${" "}
                    {Math.abs(month.balance).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs">
                    {month.balance >= 0 ? "Superávit" : "Déficit"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
