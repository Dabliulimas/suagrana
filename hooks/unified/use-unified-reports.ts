"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logComponents } from "../../lib/logger";
import { financialService } from "../../lib/services";
import { unifiedQueryKeys } from "../../lib/react-query/unified-query-client";

// Tipos para filtros de relatórios
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  category?: string;
  type?: string;
}

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  accountsCount: number;
  transactionsCount: number;
  recentTransactions: any[];
  monthlyData: {
    income: number;
    expenses: number;
    net: number;
  };
  categoryBreakdown: Record<string, number>;
  accountBalances: Record<string, number>;
}

// Hook para dados completos do dashboard
export function useUnifiedDashboard() {
  return useQuery({
    queryKey: unifiedQueryKeys.reports.dashboard(),
    queryFn: async (): Promise<DashboardData> => {
      try {
        // Buscar dados em paralelo
        const [accountsResult, transactionsResult] = await Promise.all([
          financialService.getAccounts(),
          financialService.getTransactions({ limit: 100 })
        ]);

        const accounts = accountsResult.data.items || [];
        const transactions = transactionsResult.data.items || [];

        // Calcular totais
        const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
        
        const totalIncome = transactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        
        const totalExpenses = transactions
          .filter(t => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Dados do mês atual
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        });

        const monthlyIncome = monthlyTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        
        const monthlyExpenses = monthlyTransactions
          .filter(t => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Breakdown por categoria
        const categoryBreakdown: Record<string, number> = {};
        transactions.forEach(t => {
          const category = t.category || "Sem categoria";
          categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Number(t.amount || 0);
        });

        // Saldos por conta
        const accountBalances: Record<string, number> = {};
        accounts.forEach(acc => {
          accountBalances[acc.name] = Number(acc.balance || 0);
        });

        // Transações recentes (últimas 10)
        const recentTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        return {
          totalBalance,
          totalIncome,
          totalExpenses,
          netIncome: totalIncome - totalExpenses,
          accountsCount: accounts.length,
          transactionsCount: transactions.length,
          recentTransactions,
          monthlyData: {
            income: monthlyIncome,
            expenses: monthlyExpenses,
            net: monthlyIncome - monthlyExpenses,
          },
          categoryBreakdown,
          accountBalances,
        };
      } catch (error) {
        logComponents.error("Erro ao buscar dados do dashboard:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 segundos para dashboard (dados críticos)
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// Hook para relatório mensal
export function useUnifiedMonthlyReport(month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  return useQuery({
    queryKey: unifiedQueryKeys.reports.monthly(targetMonth, targetYear),
    queryFn: async () => {
      const startDate = new Date(targetYear, targetMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(targetYear, targetMonth + 1, 0).toISOString().split('T')[0];

      const result = await financialService.getTransactions({
        startDate,
        endDate,
        limit: 1000
      });

      const transactions = result.data.items || [];

      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const expenses = transactions
        .filter(t => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const byCategory = transactions.reduce((acc, t) => {
        const category = t.category || "Sem categoria";
        if (!acc[category]) {
          acc[category] = { income: 0, expenses: 0, total: 0 };
        }
        
        const amount = Number(t.amount || 0);
        if (t.type === "income") {
          acc[category].income += amount;
        } else if (t.type === "expense" || t.type === "shared") {
          acc[category].expenses += amount;
        }
        acc[category].total += amount;
        
        return acc;
      }, {} as Record<string, { income: number; expenses: number; total: number }>);

      return {
        month: targetMonth,
        year: targetYear,
        income,
        expenses,
        net: income - expenses,
        transactionsCount: transactions.length,
        byCategory,
        transactions,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para relatório anual
export function useUnifiedYearlyReport(year?: number) {
  const targetYear = year ?? new Date().getFullYear();

  return useQuery({
    queryKey: unifiedQueryKeys.reports.yearly(targetYear),
    queryFn: async () => {
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      const result = await financialService.getTransactions({
        startDate,
        endDate,
        limit: 10000
      });

      const transactions = result.data.items || [];

      const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const expenses = transactions
        .filter(t => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      // Dados mensais
      const monthlyData = Array.from({ length: 12 }, (_, month) => {
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === month && 
                 transactionDate.getFullYear() === targetYear;
        });

        const monthIncome = monthTransactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthExpenses = monthTransactions
          .filter(t => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        return {
          month,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
          transactionsCount: monthTransactions.length,
        };
      });

      return {
        year: targetYear,
        income,
        expenses,
        net: income - expenses,
        transactionsCount: transactions.length,
        monthlyData,
        transactions,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para relatório por categoria
export function useUnifiedCategoryReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: unifiedQueryKeys.reports.byCategory(filters),
    queryFn: async () => {
      const result = await financialService.getTransactions(filters);
      const transactions = result.data.items || [];

      const categoryData = transactions.reduce((acc, transaction) => {
        const category = transaction.category || "Sem categoria";
        
        if (!acc[category]) {
          acc[category] = {
            name: category,
            income: 0,
            expenses: 0,
            net: 0,
            transactionsCount: 0,
            transactions: [],
          };
        }

        const amount = Number(transaction.amount || 0);
        acc[category].transactionsCount++;
        acc[category].transactions.push(transaction);

        if (transaction.type === "income") {
          acc[category].income += amount;
        } else if (transaction.type === "expense" || transaction.type === "shared") {
          acc[category].expenses += amount;
        }

        acc[category].net = acc[category].income - acc[category].expenses;
        
        return acc;
      }, {} as Record<string, any>);

      return Object.values(categoryData);
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para estatísticas rápidas
export function useUnifiedQuickStats() {
  return useQuery({
    queryKey: unifiedQueryKeys.reports.quickStats(),
    queryFn: async () => {
      const [accountsResult, transactionsResult] = await Promise.all([
        financialService.getAccounts(),
        financialService.getTransactions({ limit: 50 })
      ]);

      const accounts = accountsResult.data.items || [];
      const transactions = transactionsResult.data.items || [];

      const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
      
      const today = new Date();
      const todayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === today.toDateString();
      });

      const thisWeekTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      });

      return {
        totalBalance,
        accountsCount: accounts.length,
        todayTransactions: todayTransactions.length,
        thisWeekTransactions: thisWeekTransactions.length,
        lastTransaction: transactions[0] || null,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para stats rápidas
    refetchOnWindowFocus: true,
  });
}

// Hook para forçar atualização de todos os relatórios
export function useUnifiedRefreshReports() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.quickStats() }),
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
        queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.stats() }),
      ]);
      
      logComponents.info("Todos os relatórios foram atualizados");
    } catch (error) {
      logComponents.error("Erro ao atualizar relatórios:", error);
    }
  };
}

// Exportar tipos
export type { ReportFilters, DashboardData };