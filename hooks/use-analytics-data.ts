"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { db } from "../lib/db";

export interface AnalyticsData {
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
    balance: number;
    savings: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  goalProgress: Array<{
    name: string;
    current: number;
    target: number;
    percentage: number;
    daysRemaining?: number;
  }>;
  investmentPerformance: Array<{
    month: string;
    invested: number;
    currentValue: number;
    return: number;
  }>;
  insights: Array<{
    type: "positive" | "negative" | "neutral" | "warning";
    title: string;
    description: string;
    value?: string;
    trend?: "up" | "down" | "stable";
  }>;
  kpis: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    investmentReturn: number;
    goalCompletionRate: number;
  };
}

const CATEGORY_COLORS = {
  Alimentação: "#FF6B6B",
  Transporte: "#4ECDC4",
  Moradia: "#45B7D1",
  Saúde: "#96CEB4",
  Educação: "#FFEAA7",
  Lazer: "#DDA0DD",
  Compras: "#98D8C8",
  Investimentos: "#F7DC6F",
  Outros: "#AED6F1",
};

export function useAnalyticsData(
  period: string = "6months",
  categoryFilter: string = "all",
) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyticsData() {
      setIsLoading(true);
      setError(null);

      try {
        // Buscar dados do banco de dados
        const [transactions, goals, investments, accounts] = await Promise.all([
          db.transaction.findMany({
            orderBy: { date: "desc" },
            take: 1000, // Limitar para performance
          }),
          db.goal.findMany({
            orderBy: { createdAt: "desc" },
          }),
          db.investment.findMany({
            orderBy: { date: "desc" },
          }),
          db.account.findMany({
            orderBy: { name: "asc" },
          }),
        ]);

        // Gerar dados de tendências mensais
        const monthlyTrends = generateMonthlyTrends(transactions, period);

        // Gerar breakdown por categoria
        const categoryBreakdown = generateCategoryBreakdown(
          transactions,
          categoryFilter,
        );

        // Gerar progresso de metas
        const goalProgress = generateGoalProgress(goals);

        // Gerar performance de investimentos
        const investmentPerformance =
          generateInvestmentPerformance(investments);

        // Gerar insights
        const insights = generateInsights(
          transactions,
          goals,
          investments,
          accounts,
        );

        // Gerar KPIs
        const kpis = generateKPIs(transactions, goals, investments, accounts);

        setData({
          monthlyTrends,
          categoryBreakdown,
          goalProgress,
          investmentPerformance,
          insights,
          kpis,
        });
      } catch (err) {
        logComponents.error("Erro ao buscar dados de analytics:", err);
        setError("Erro ao carregar dados de analytics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalyticsData();
  }, [period, categoryFilter]);

  return { data, isLoading, error };
}

function getMonthsForPeriod(period: string): string[] {
  const now = new Date();
  const months: string[] = [];

  let monthsCount = 6;
  if (period === "3months") monthsCount = 3;
  else if (period === "12months") monthsCount = 12;
  else if (period === "24months") monthsCount = 24;

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(date.toISOString().slice(0, 7)); // YYYY-MM
  }

  return months;
}

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function generateMonthlyTrends(transactions: any[], period: string) {
  const months = getMonthsForPeriod(period);

  return months.map((month) => {
    const monthTransactions = transactions.filter((t) => {
      const transactionMonth = new Date(t.date).toISOString().slice(0, 7);
      return transactionMonth === month;
    });

    const income = monthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month: formatMonth(month),
      income,
      expenses,
      balance: income - expenses,
      savings: Math.max(0, income - expenses),
    };
  });
}

function generateCategoryBreakdown(
  transactions: any[],
  categoryFilter: string,
) {
  const filteredTransactions = transactions.filter((t) => {
    if (categoryFilter === "all") return t.type === "EXPENSE";
    return t.category === categoryFilter && t.type === "EXPENSE";
  });

  const categoryTotals = filteredTransactions.reduce(
    (acc, t) => {
      const category = t.category || "Outros";
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = Object.values(categoryTotals).reduce(
    (sum, amount) => sum + amount,
    0,
  );

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color:
        CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#AED6F1",
    }))
    .sort((a, b) => b.amount - a.amount);
}

function generateGoalProgress(goals: any[]) {
  return goals.map((goal) => {
    const percentage =
      goal.target > 0 ? (Number(goal.current) / Number(goal.target)) * 100 : 0;
    let daysRemaining: number | undefined;

    if (goal.deadline) {
      const deadline = new Date(goal.deadline);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      name: goal.name,
      current: Number(goal.current),
      target: Number(goal.target),
      percentage: Math.min(percentage, 100),
      daysRemaining,
    };
  });
}

function generateInvestmentPerformance(investments: any[]) {
  const months = getMonthsForPeriod("12months");

  return months.map((month) => {
    const monthInvestments = investments.filter((inv) => {
      const investmentMonth = new Date(inv.date).toISOString().slice(0, 7);
      return investmentMonth === month;
    });

    const invested = monthInvestments
      .filter((inv) => inv.operation === "BUY")
      .reduce((sum, inv) => sum + Number(inv.totalValue), 0);

    const sold = monthInvestments
      .filter((inv) => inv.operation === "SELL")
      .reduce((sum, inv) => sum + Number(inv.totalValue), 0);

    const netInvested = invested - sold;
    const currentValue = netInvested * 1.05; // Simulação de 5% de retorno

    return {
      month: formatMonth(month),
      invested: netInvested,
      currentValue,
      return: currentValue - netInvested,
    };
  });
}

function generateInsights(
  transactions: any[],
  goals: any[],
  investments: any[],
  accounts: any[],
) {
  const insights: any[] = [];

  // Análise de gastos do mês atual
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthExpenses = transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date).toISOString().slice(0, 7) === currentMonth,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
    .toISOString()
    .slice(0, 7);
  const lastMonthExpenses = transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date).toISOString().slice(0, 7) === lastMonth,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (currentMonthExpenses > lastMonthExpenses * 1.1) {
    insights.push({
      type: "warning",
      title: "Gastos Elevados",
      description: `Seus gastos este mês estão ${((currentMonthExpenses / lastMonthExpenses - 1) * 100).toFixed(1)}% maiores que o mês passado`,
      value: `R$ ${currentMonthExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      trend: "up",
    });
  }

  // Análise de metas próximas do prazo
  const urgentGoals = goals.filter((goal) => {
    if (!goal.deadline) return false;
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const progress = Number(goal.current) / Number(goal.target);
    return daysRemaining <= 30 && progress < 0.8;
  });

  if (urgentGoals.length > 0) {
    insights.push({
      type: "warning",
      title: "Metas em Risco",
      description: `${urgentGoals.length} meta(s) com prazo próximo e progresso baixo`,
      trend: "down",
    });
  }

  // Análise positiva de economia
  const currentMonthIncome = transactions
    .filter(
      (t) =>
        t.type === "INCOME" &&
        new Date(t.date).toISOString().slice(0, 7) === currentMonth,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const savingsRate =
    currentMonthIncome > 0
      ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100
      : 0;

  if (savingsRate > 20) {
    insights.push({
      type: "positive",
      title: "Excelente Taxa de Poupança",
      description: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda este mês`,
      value: `${savingsRate.toFixed(1)}%`,
      trend: "up",
    });
  }

  return insights;
}

function generateKPIs(
  transactions: any[],
  goals: any[],
  investments: any[],
  accounts: any[],
) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyIncome = transactions
    .filter(
      (t) =>
        t.type === "INCOME" &&
        new Date(t.date).toISOString().slice(0, 7) === currentMonth,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter(
      (t) =>
        t.type === "EXPENSE" &&
        new Date(t.date).toISOString().slice(0, 7) === currentMonth,
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0,
  );

  const savingsRate =
    monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
      : 0;

  const totalInvested = investments
    .filter((inv) => inv.operation === "BUY")
    .reduce((sum, inv) => sum + Number(inv.totalValue), 0);

  const totalSold = investments
    .filter((inv) => inv.operation === "SELL")
    .reduce((sum, inv) => sum + Number(inv.totalValue), 0);

  const netInvested = totalInvested - totalSold;
  const investmentReturn = netInvested > 0 ? 5.0 : 0; // Simulação de 5% de retorno

  const completedGoals = goals.filter(
    (goal) => Number(goal.current) >= Number(goal.target),
  ).length;
  const goalCompletionRate =
    goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    investmentReturn,
    goalCompletionRate,
  };
}
