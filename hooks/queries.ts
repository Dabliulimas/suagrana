"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { financialService } from "../lib/services";
import type { Transaction, Account, Goal, Investment, Trip } from "../lib/storage";

// Hook para transações com filtros e paginação
export function useTransactions(options?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  category?: string;
}) {
  const { data: allData = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const result = await financialService.getTransactions();
      return result.data.items || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Aplicar filtros e paginação
  const filteredData = useMemo(() => {
    let filtered = [...allData];

    // Aplicar filtros
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower)
      );
    }

    if (options?.type && options.type !== "all") {
      filtered = filtered.filter(t => t.type === options.type);
    }

    if (options?.category && options.category !== "all") {
      filtered = filtered.filter(t => t.category === options.category);
    }

    // Ordenar por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [allData, options?.search, options?.type, options?.category]);

  // Aplicar paginação
  const paginatedData = useMemo(() => {
    if (!options?.page || !options?.limit) {
      return {
        data: filteredData,
        pagination: null
      };
    }

    const page = options.page;
    const limit = options.limit;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedTransactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / limit),
        total: filteredData.length,
        limit: limit,
        hasNextPage: endIndex < filteredData.length,
        hasPrevPage: page > 1
      }
    };
  }, [filteredData, options?.page, options?.limit]);

  // Retornar dados sem filtros quando não há opções (compatibilidade)
  if (!options) {
    return { data: allData, isLoading, refetch: loadData };
  }

  return { 
    data: paginatedData, 
    isLoading, 
    refetch: loadData,
    totalCount: filteredData.length,
    allData: filteredData
  };
}

// Hook para contas
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const result = await financialService.getAccounts();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para metas
export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const result = await financialService.getGoals();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para investimentos
export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: async () => {
      const result = await financialService.getInvestments();
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para viagens
export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      // Por enquanto, retorna array vazio até implementarmos o endpoint de viagens
      return [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para métricas do dashboard
export function useDashboardMetrics() {
  const { data: transactions, isLoading: transactionsLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  
  const isLoading = transactionsLoading || accountsLoading || goalsLoading;
  
  // Calcular métricas do mês atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;

  // Transações recentes (últimas 10)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Metas ativas - suportar diferentes estruturas
  const activeGoals = goals.filter((g) => {
    const current = g.current || g.currentAmount || 0;
    const target = g.target || g.targetAmount || 1;
    return current < target && !g.isCompleted;
  });

  // Análise de categorias
  const categoryBreakdown = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Análise de tendências (comparação com mês anterior)
  const lastMonth = new Date(currentYear, currentMonth - 1);
  const lastMonthTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === lastMonth.getMonth() &&
      transactionDate.getFullYear() === lastMonth.getFullYear()
    );
  });

  const lastMonthIncome = lastMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const trendAnalysis = {
    incomeChange: lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
    expenseChange: lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
  };

  const metrics = {
    totalIncome,
    totalExpenses,
    netIncome,
    accountsBalance: accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    transactionCount: transactions.length,
    activeGoalsCount: activeGoals.length,
  };

  return {
    metrics,
    isLoading,
    totalIncome,
    totalExpenses,
    netIncome,
    categoryBreakdown,
    recentTransactions,
    activeGoals,
    trendAnalysis,
  };
}
