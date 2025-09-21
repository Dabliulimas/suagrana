"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logComponents } from "../lib/logger";

// Tipos
interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  toAccountId?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TransactionFilters {
  accountId?: string;
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  status?: "PENDING" | "COMPLETED" | "CANCELLED";
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface CreateTransactionData {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  description: string;
  category: string;
  date: string;
  accountId: string;
  toAccountId?: string;
  tags?: string[];
}

// Query Keys
const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  stats: () => [...transactionKeys.all, 'stats'] as const,
  recent: (limit: number) => [...transactionKeys.all, 'recent', limit] as const,
};

// API Functions
const transactionApi = {
  getAll: async (filters?: TransactionFilters): Promise<{ transactions: Transaction[]; pagination: any; summary: any }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const response = await fetch(`/api/transactions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar transações: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar transações');
    }

    return result.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar transação: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar transação');
    }

    return result.data.transaction;
  },

  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar transação: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar transação');
    }

    return result.data.transaction;
  },

  update: async (id: string, data: Partial<CreateTransactionData>): Promise<Transaction> => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar transação: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar transação');
    }

    return result.data.transaction;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar transação: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao deletar transação');
    }
  },
};

// Hooks

/**
 * Hook para buscar todas as transações com filtros
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // Não retry em erros de autenticação
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para buscar uma transação específica
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar transações recentes
 */
export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: transactionKeys.recent(limit),
    queryFn: async () => {
      const result = await transactionApi.getAll({ limit, page: 1 });
      return result.transactions;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para criar transação
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: (newTransaction) => {
      // Invalidar todas as listas de transações
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      
      // Invalidar contas (saldo pode ter mudado)
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      // Adicionar ao cache de detalhes
      queryClient.setQueryData(
        transactionKeys.detail(newTransaction.id),
        newTransaction
      );

      toast.success("Transação criada com sucesso!");
      logComponents.info("Transação criada:", newTransaction.id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao criar transação";
      toast.error(message);
      logComponents.error("Erro ao criar transação:", error);
    },
  });
}

/**
 * Hook para atualizar transação
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) =>
      transactionApi.update(id, data),
    onSuccess: (updatedTransaction, { id }) => {
      // Atualizar cache específico
      queryClient.setQueryData(
        transactionKeys.detail(id),
        updatedTransaction
      );
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      
      // Invalidar contas
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      toast.success("Transação atualizada com sucesso!");
      logComponents.info("Transação atualizada:", id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao atualizar transação";
      toast.error(message);
      logComponents.error("Erro ao atualizar transação:", error);
    },
  });
}

/**
 * Hook para deletar transação
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionApi.delete,
    onSuccess: (_, id) => {
      // Remover do cache específico
      queryClient.removeQueries({ queryKey: transactionKeys.detail(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: transactionKeys.stats() });
      
      // Invalidar contas
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      toast.success("Transação deletada com sucesso!");
      logComponents.info("Transação deletada:", id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao deletar transação";
      toast.error(message);
      logComponents.error("Erro ao deletar transação:", error);
    },
  });
}

/**
 * Hook para estatísticas de transações
 */
export function useTransactionStats(filters?: TransactionFilters) {
  return useQuery({
    queryKey: [...transactionKeys.stats(), filters],
    queryFn: async () => {
      const result = await transactionApi.getAll(filters);
      const transactions = result.transactions;

      const income = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const balance = income - expenses;

      return {
        income,
        expenses,
        balance,
        transactionCount: transactions.length,
        averageTransaction: transactions.length > 0 ? (income + expenses) / transactions.length : 0,
        byCategory: transactions.reduce((acc, t) => {
          const category = t.category || "Sem categoria";
          if (!acc[category]) {
            acc[category] = { count: 0, total: 0 };
          }
          acc[category].count++;
          acc[category].total += Math.abs(t.amount);
          return acc;
        }, {} as Record<string, { count: number; total: number }>),
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Exportar tipos
export type { Transaction, TransactionFilters, CreateTransactionData };