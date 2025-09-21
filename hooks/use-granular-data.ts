"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction, Account, Goal, Investment } from "@/lib/types";

// Query Keys para invalidação granular
export const queryKeys = {
  // Transações
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.transactions.lists(), filters] as const,
    recent: (limit: number) => [...queryKeys.transactions.all, 'recent', limit] as const,
    byCategory: (category: string) => [...queryKeys.transactions.all, 'category', category] as const,
    byAccount: (accountId: string) => [...queryKeys.transactions.all, 'account', accountId] as const,
    summary: () => [...queryKeys.transactions.all, 'summary'] as const,
    monthlyStats: (year: number, month: number) => [...queryKeys.transactions.all, 'monthly', year, month] as const,
  },
  
  // Contas
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.accounts.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.accounts.all, 'detail', id] as const,
    balance: (id: string) => [...queryKeys.accounts.all, 'balance', id] as const,
    summary: () => [...queryKeys.accounts.all, 'summary'] as const,
  },
  
  // Metas
  goals: {
    all: ['goals'] as const,
    lists: () => [...queryKeys.goals.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.goals.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.goals.all, 'detail', id] as const,
    progress: () => [...queryKeys.goals.all, 'progress'] as const,
    active: () => [...queryKeys.goals.all, 'active'] as const,
  },
  
  // Investimentos
  investments: {
    all: ['investments'] as const,
    lists: () => [...queryKeys.investments.all, 'list'] as const,
    list: (filters?: any) => [...queryKeys.investments.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.investments.all, 'detail', id] as const,
    portfolio: () => [...queryKeys.investments.all, 'portfolio'] as const,
    performance: () => [...queryKeys.investments.all, 'performance'] as const,
  },
  
  // Relatórios
  reports: {
    all: ['reports'] as const,
    dashboard: () => [...queryKeys.reports.all, 'dashboard'] as const,
    cashFlow: (startDate: string, endDate: string) => [...queryKeys.reports.all, 'cashFlow', startDate, endDate] as const,
    categorySpending: (period: string) => [...queryKeys.reports.all, 'categorySpending', period] as const,
    monthlyOverview: (year: number, month: number) => [...queryKeys.reports.all, 'monthly', year, month] as const,
  },
  
  // Cards específicos do dashboard
  cards: {
    all: ['cards'] as const,
    totalBalance: () => [...queryKeys.cards.all, 'totalBalance'] as const,
    monthlyIncome: () => [...queryKeys.cards.all, 'monthlyIncome'] as const,
    monthlyExpenses: () => [...queryKeys.cards.all, 'monthlyExpenses'] as const,
    savingsRate: () => [...queryKeys.cards.all, 'savingsRate'] as const,
    goalProgress: () => [...queryKeys.cards.all, 'goalProgress'] as const,
    investmentValue: () => [...queryKeys.cards.all, 'investmentValue'] as const,
  }
};

// Hook para invalidação granular
export function useGranularInvalidation() {
  const queryClient = useQueryClient();

  const invalidateTransactionRelated = (transactionData?: Partial<Transaction>) => {
    // Invalidar queries relacionadas a transações
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.totalBalance() });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.monthlyIncome() });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.monthlyExpenses() });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.savingsRate() });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard() });
    
    // Se temos dados da transação, invalidar queries específicas
    if (transactionData) {
      if (transactionData.category) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byCategory(transactionData.category) });
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.categorySpending('current') });
      }
      
      if (transactionData.accountId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byAccount(transactionData.accountId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts.balance(transactionData.accountId) });
      }
      
      if (transactionData.date) {
        const date = new Date(transactionData.date);
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.transactions.monthlyStats(date.getFullYear(), date.getMonth() + 1) 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.reports.monthlyOverview(date.getFullYear(), date.getMonth() + 1) 
        });
      }
    }
  };

  const invalidateAccountRelated = (accountData?: Partial<Account>) => {
    // Invalidar queries relacionadas a contas
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.totalBalance() });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard() });
    
    if (accountData?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(accountData.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.balance(accountData.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.byAccount(accountData.id) });
    }
  };

  const invalidateGoalRelated = (goalData?: Partial<Goal>) => {
    // Invalidar queries relacionadas a metas
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.goalProgress() });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard() });
    
    if (goalData?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(goalData.id) });
    }
  };

  const invalidateInvestmentRelated = (investmentData?: Partial<Investment>) => {
    // Invalidar queries relacionadas a investimentos
    queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.investmentValue() });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.totalBalance() });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard() });
    
    if (investmentData?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.detail(investmentData.id) });
    }
  };

  const invalidateSpecificCard = (cardType: keyof typeof queryKeys.cards) => {
    if (cardType === 'all') return;
    queryClient.invalidateQueries({ queryKey: queryKeys.cards[cardType]() });
  };

  const invalidateSpecificReport = (reportType: string, ...params: any[]) => {
    switch (reportType) {
      case 'dashboard':
        queryClient.invalidateQueries({ queryKey: queryKeys.reports.dashboard() });
        break;
      case 'cashFlow':
        if (params.length >= 2) {
          queryClient.invalidateQueries({ queryKey: queryKeys.reports.cashFlow(params[0], params[1]) });
        }
        break;
      case 'categorySpending':
        if (params.length >= 1) {
          queryClient.invalidateQueries({ queryKey: queryKeys.reports.categorySpending(params[0]) });
        }
        break;
    }
  };

  return {
    invalidateTransactionRelated,
    invalidateAccountRelated,
    invalidateGoalRelated,
    invalidateInvestmentRelated,
    invalidateSpecificCard,
    invalidateSpecificReport,
    queryClient
  };
}

// Hook para dados de transações granulares
export function useGranularTransactions() {
  const { invalidateTransactionRelated } = useGranularInvalidation();

  // Query para todas as transações
  const useTransactionsList = (filters?: any) => {
    return useQuery({
      queryKey: queryKeys.transactions.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao buscar transações');
        const result = await response.json();
        return result.data || result;
      },
      staleTime: 30000, // 30 segundos
      gcTime: 5 * 60 * 1000, // 5 minutos
    });
  };

  // Query para transações recentes
  const useRecentTransactions = (limit: number = 10) => {
    return useQuery({
      queryKey: queryKeys.transactions.recent(limit),
      queryFn: async () => {
        const response = await fetch(`/api/transactions?limit=${limit}&sort=date&order=desc`);
        if (!response.ok) throw new Error('Erro ao buscar transações recentes');
        const result = await response.json();
        return result.data?.transactions || result.transactions || [];
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    });
  };

  // Query para transações por categoria
  const useTransactionsByCategory = (category: string) => {
    return useQuery({
      queryKey: queryKeys.transactions.byCategory(category),
      queryFn: async () => {
        const response = await fetch(`/api/transactions?category=${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error('Erro ao buscar transações por categoria');
        const result = await response.json();
        return result.data?.transactions || result.transactions || [];
      },
      staleTime: 60000, // 1 minuto
      gcTime: 5 * 60 * 1000,
    });
  };

  // Query para resumo de transações
  const useTransactionsSummary = () => {
    return useQuery({
      queryKey: queryKeys.transactions.summary(),
      queryFn: async () => {
        const response = await fetch('/api/transactions/summary');
        if (!response.ok) throw new Error('Erro ao buscar resumo de transações');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Mutação para criar transação
  const useCreateTransaction = () => {
    return useMutation({
      mutationFn: async (transactionData: Omit<Transaction, 'id'>) => {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });
        if (!response.ok) throw new Error('Erro ao criar transação');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateTransactionRelated(variables);
      },
    });
  };

  // Mutação para atualizar transação
  const useUpdateTransaction = () => {
    return useMutation({
      mutationFn: async ({ id, ...transactionData }: Partial<Transaction> & { id: string }) => {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });
        if (!response.ok) throw new Error('Erro ao atualizar transação');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateTransactionRelated(variables);
      },
    });
  };

  // Mutação para deletar transação
  const useDeleteTransaction = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao deletar transação');
        return response.json();
      },
      onSuccess: () => {
        invalidateTransactionRelated();
      },
    });
  };

  return {
    useTransactionsList,
    useRecentTransactions,
    useTransactionsByCategory,
    useTransactionsSummary,
    useCreateTransaction,
    useUpdateTransaction,
    useDeleteTransaction,
  };
}