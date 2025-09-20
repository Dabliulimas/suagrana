"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/react-query/query-client";
import { useTransactions } from "./use-transactions";
import { useAccounts } from "../../contexts/unified-context";
import { useInvestments } from "./use-investments";
import { useGoals } from "./use-goals";
import { useTrips } from "./use-trips";
import type {
  Transaction,
  Account,
  Investment,
  Goal,
  Trip,
} from "../../lib/storage";

interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  totalInvestments: number;
  netWorth: number;
  monthlyBalance: number;
  savingsRate: number;
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  recentTransactions: Transaction[];
  activeGoals: Goal[];
  trendAnalysis: {
    incomeChange: number;
    expenseChange: number;
  };
}

// Hook principal para cálculos financeiros otimizados
export function useFinancialCalculations() {
  // Buscar dados usando os hooks específicos
  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: investments = [] } = useInvestments();
  const { data: goals = [] } = useGoals();
  const { data: trips = [] } = useTrips();

  return useQuery({
    queryKey: queryKeys.calculations.dashboard({
      transactionsCount: transactions.length,
      accountsCount: accounts.length,
      investmentsCount: investments.length,
      goalsCount: goals.length,
      tripsCount: trips.length,
    }),
    queryFn: async (): Promise<FinancialMetrics> => {
      // Validar arrays
      const safeTransactions = Array.isArray(transactions) ? transactions : [];
      const safeAccounts = Array.isArray(accounts) ? accounts : [];
      const safeInvestments = Array.isArray(investments) ? investments : [];
      const safeGoals = Array.isArray(goals) ? goals : [];

      // Cálculos básicos
      const totalIncome = safeTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalExpenses = safeTransactions
        .filter((t) => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      const totalBalance = totalIncome - totalExpenses;

      const accountsBalance = safeAccounts.reduce(
        (sum, acc) => sum + (acc.balance || 0),
        0,
      );

      const totalInvestments = safeInvestments.reduce(
        (sum, inv) => sum + (inv.currentValue || inv.totalValue || 0),
        0,
      );

      const netWorth = accountsBalance + totalInvestments;

      // Cálculo mensal (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyTransactions = safeTransactions.filter(
        (t) => new Date(t.date) >= thirtyDaysAgo,
      );

      const monthlyIncome = monthlyTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const monthlyExpenses = monthlyTransactions
        .filter((t) => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      const monthlyBalance = monthlyIncome - monthlyExpenses;
      const savingsRate =
        monthlyIncome > 0 ? (monthlyBalance / monthlyIncome) * 100 : 0;

      // Análise por categoria
      const expensesByCategory = safeTransactions
        .filter((t) => t.type === "expense" || t.type === "shared")
        .reduce(
          (acc, t) => {
            const category = t.category || "Sem categoria";
            acc[category] = (acc[category] || 0) + Math.abs(t.amount || 0);
            return acc;
          },
          {} as Record<string, number>,
        );

      const incomeByCategory = safeTransactions
        .filter((t) => t.type === "income")
        .reduce(
          (acc, t) => {
            const category = t.category || "Sem categoria";
            acc[category] = (acc[category] || 0) + (t.amount || 0);
            return acc;
          },
          {} as Record<string, number>,
        );

      // Transações recentes (últimas 10)
      const recentTransactions = safeTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      // Metas ativas
      const now = new Date();
      const activeGoals = safeGoals.filter((goal) => {
        if (!goal.deadline) return true;
        const deadline = new Date(goal.deadline);
        return deadline >= now;
      });

      // Análise de tendências (comparar com mês anterior)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const previousMonthTransactions = safeTransactions.filter((t) => {
        const date = new Date(t.date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });

      const previousMonthIncome = previousMonthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const previousMonthExpenses = previousMonthTransactions
        .filter((t) => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

      const incomeChange =
        previousMonthIncome > 0
          ? ((monthlyIncome - previousMonthIncome) / previousMonthIncome) * 100
          : 0;

      const expenseChange =
        previousMonthExpenses > 0
          ? ((monthlyExpenses - previousMonthExpenses) /
              previousMonthExpenses) *
            100
          : 0;

      return {
        totalIncome,
        totalExpenses,
        totalBalance,
        totalInvestments,
        netWorth,
        monthlyBalance,
        savingsRate,
        expensesByCategory,
        incomeByCategory,
        recentTransactions,
        activeGoals,
        trendAnalysis: {
          incomeChange,
          expenseChange,
        },
      };
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para cálculos específicos do dashboard
export function useDashboardMetrics() {
  // Em vez de calcular apenas no cliente, buscar resumo real do backend para consistência global
  const query = useQuery({
    queryKey: queryKeys.reports.dashboard(),
    queryFn: async () => {
      const res = await fetch("/api/reports/dashboard?userId=1");
      if (!res.ok) throw new Error("Falha ao carregar resumo do dashboard");
      return res.json();
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const data = query.data || {};
  return {
    metrics: data,
    isLoading: query.isLoading,
    error: query.error,
    totalIncome: data.totalIncome || 0,
    totalExpenses: data.totalExpenses || 0,
    netIncome: (data.totalIncome || 0) - (data.totalExpenses || 0),
    categoryBreakdown: data.categoryBreakdown || {},
    recentTransactions: data.recentTransactions || [],
    activeGoals: data.activeGoals || [],
    trendAnalysis: data.trendAnalysis || { incomeChange: 0, expenseChange: 0 },
  };
}

// Hook para relatórios financeiros
export function useFinancialReports(period?: { start: string; end: string }) {
  const { data: transactions = [] } = useTransactions();

  return useQuery({
    queryKey: queryKeys.calculations.reports(period),
    queryFn: async () => {
      let filteredTransactions = transactions;

      if (period) {
        filteredTransactions = transactions.filter(
          (t) => t.date >= period.start && t.date <= period.end,
        );
      }

      const income = filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const balance = income - expenses;

      // Análise por categoria
      const categoryAnalysis = filteredTransactions.reduce(
        (acc, t) => {
          const category = t.category || "Sem categoria";
          if (!acc[category]) {
            acc[category] = { income: 0, expenses: 0, balance: 0 };
          }

          if (t.type === "income") {
            acc[category].income += t.amount;
          } else {
            acc[category].expenses += Math.abs(t.amount);
          }

          acc[category].balance = acc[category].income - acc[category].expenses;
          return acc;
        },
        {} as Record<
          string,
          { income: number; expenses: number; balance: number }
        >,
      );

      // Análise temporal (por mês)
      const monthlyAnalysis = filteredTransactions.reduce(
        (acc, t) => {
          const month = t.date.substring(0, 7); // YYYY-MM
          if (!acc[month]) {
            acc[month] = { income: 0, expenses: 0, balance: 0 };
          }

          if (t.type === "income") {
            acc[month].income += t.amount;
          } else {
            acc[month].expenses += Math.abs(t.amount);
          }

          acc[month].balance = acc[month].income - acc[month].expenses;
          return acc;
        },
        {} as Record<
          string,
          { income: number; expenses: number; balance: number }
        >,
      );

      return {
        summary: {
          income,
          expenses,
          balance,
          transactionCount: filteredTransactions.length,
        },
        categoryAnalysis,
        monthlyAnalysis,
        period,
      };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
