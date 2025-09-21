"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./use-granular-data";

export function useGranularCards() {
  // Card de saldo total
  const useTotalBalance = () => {
    return useQuery({
      queryKey: queryKeys.cards.totalBalance(),
      queryFn: async () => {
        const response = await fetch('/api/accounts/summary');
        if (!response.ok) throw new Error('Erro ao buscar saldo total');
        const data = await response.json();
        return {
          total: data.totalBalance || 0,
          accounts: data.accounts || [],
        };
      },
      staleTime: 30000, // 30 segundos
      gcTime: 5 * 60 * 1000,
    });
  };

  // Card de receitas do mês
  const useMonthlyIncome = () => {
    return useQuery({
      queryKey: queryKeys.cards.monthlyIncome(),
      queryFn: async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        const response = await fetch(`/api/transactions/summary?year=${year}&month=${month}&type=income`);
        if (!response.ok) throw new Error('Erro ao buscar receitas do mês');
        const data = await response.json();
        
        return {
          current: data.total || 0,
          previous: data.previousMonth || 0,
          change: data.change || 0,
          changePercent: data.changePercent || 0,
        };
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Card de despesas do mês
  const useMonthlyExpenses = () => {
    return useQuery({
      queryKey: queryKeys.cards.monthlyExpenses(),
      queryFn: async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        const response = await fetch(`/api/transactions/summary?year=${year}&month=${month}&type=expense`);
        if (!response.ok) throw new Error('Erro ao buscar despesas do mês');
        const data = await response.json();
        
        return {
          current: Math.abs(data.total || 0),
          previous: Math.abs(data.previousMonth || 0),
          change: data.change || 0,
          changePercent: data.changePercent || 0,
        };
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Card de taxa de poupança
  const useSavingsRate = () => {
    return useQuery({
      queryKey: queryKeys.cards.savingsRate(),
      queryFn: async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        const [incomeRes, expenseRes] = await Promise.all([
          fetch(`/api/transactions/summary?year=${year}&month=${month}&type=income`),
          fetch(`/api/transactions/summary?year=${year}&month=${month}&type=expense`)
        ]);
        
        if (!incomeRes.ok || !expenseRes.ok) {
          throw new Error('Erro ao buscar dados para taxa de poupança');
        }
        
        const incomeData = await incomeRes.json();
        const expenseData = await expenseRes.json();
        
        const income = incomeData.total || 0;
        const expenses = Math.abs(expenseData.total || 0);
        const savings = income - expenses;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        
        return {
          rate: savingsRate,
          savings,
          income,
          expenses,
        };
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Card de progresso das metas
  const useGoalProgress = () => {
    return useQuery({
      queryKey: queryKeys.cards.goalProgress(),
      queryFn: async () => {
        const response = await fetch('/api/goals/progress');
        if (!response.ok) throw new Error('Erro ao buscar progresso das metas');
        const data = await response.json();
        
        return {
          totalGoals: data.totalGoals || 0,
          completedGoals: data.completedGoals || 0,
          activeGoals: data.activeGoals || 0,
          totalTarget: data.totalTarget || 0,
          totalSaved: data.totalSaved || 0,
          overallProgress: data.overallProgress || 0,
        };
      },
      staleTime: 60000, // 1 minuto
      gcTime: 10 * 60 * 1000,
    });
  };

  // Card de valor dos investimentos
  const useInvestmentValue = () => {
    return useQuery({
      queryKey: queryKeys.cards.investmentValue(),
      queryFn: async () => {
        const response = await fetch('/api/investments/summary');
        if (!response.ok) throw new Error('Erro ao buscar valor dos investimentos');
        const data = await response.json();
        
        return {
          totalValue: data.totalValue || 0,
          totalInvested: data.totalInvested || 0,
          totalReturn: data.totalReturn || 0,
          returnPercent: data.returnPercent || 0,
          portfolios: data.portfolios || [],
        };
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Card de gastos por categoria (top 5)
  const useCategorySpending = () => {
    return useQuery({
      queryKey: queryKeys.reports.categorySpending('current'),
      queryFn: async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        
        const response = await fetch(`/api/transactions/by-category?year=${year}&month=${month}&limit=5`);
        if (!response.ok) throw new Error('Erro ao buscar gastos por categoria');
        const data = await response.json();
        
        return data.categories || [];
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Card de transações recentes
  const useRecentTransactionsCard = () => {
    return useQuery({
      queryKey: queryKeys.transactions.recent(5),
      queryFn: async () => {
        const response = await fetch('/api/transactions?limit=5&sort=date&order=desc');
        if (!response.ok) throw new Error('Erro ao buscar transações recentes');
        const result = await response.json();
        return result.data?.transactions || result.transactions || [];
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Card de fluxo de caixa (últimos 6 meses)
  const useCashFlow = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return useQuery({
      queryKey: queryKeys.reports.cashFlow(startDateStr, endDateStr),
      queryFn: async () => {
        const response = await fetch(`/api/reports/cash-flow?startDate=${startDateStr}&endDate=${endDateStr}`);
        if (!response.ok) throw new Error('Erro ao buscar fluxo de caixa');
        const data = await response.json();
        
        return {
          months: data.months || [],
          totalIncome: data.totalIncome || 0,
          totalExpenses: data.totalExpenses || 0,
          netFlow: data.netFlow || 0,
        };
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  return {
    useTotalBalance,
    useMonthlyIncome,
    useMonthlyExpenses,
    useSavingsRate,
    useGoalProgress,
    useInvestmentValue,
    useCategorySpending,
    useRecentTransactionsCard,
    useCashFlow,
  };
}