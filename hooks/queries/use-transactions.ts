"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logComponents } from "../../lib/logger";
import { queryKeys, invalidateQueries } from "../../lib/react-query/query-client";
import { useAccounts } from "../../contexts/unified-context";
import financialService, { Transaction, TransactionFilters } from "../../lib/services/financialService";
import { toast } from "sonner";

// Hook para buscar todas as transações com paginação
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: async () => {
      const result = await financialService.getTransactions(filters);
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

// Hook para buscar uma transação específica
export function useTransaction(id: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: async () => {
      const result = await financialService.getTransactionById(id);
      return result.data;
    },
    enabled: !!id,
  });
}

// Hook para criar transação
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">) => {
      const result = await financialService.createTransaction(transaction);
      return result.data;
    },
    onSuccess: () => {
      // Invalidar cache de transações
      invalidateQueries.transactions();
      invalidateQueries.accounts();
      invalidateQueries.calculations();
      toast.success("Transação criada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao criar transação:", error);
      toast.error("Erro ao criar transação");
    },
  });
}

// Hook para atualizar transação
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt">>;
    }) => {
      const result = await financialService.updateTransaction(id, data);
      return result.data;
    },
    onSuccess: (_, { id }) => {
      // Invalidar cache específico e geral
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(id),
      });
      invalidateQueries.transactions();
      invalidateQueries.calculations();
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao atualizar transação:", error);
      toast.error("Erro ao atualizar transação");
    },
  });
}

// Hook para deletar transação
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await financialService.deleteTransaction(id);
      return id;
    },
    onSuccess: (_, id) => {
      // Remover do cache específico
      queryClient.removeQueries({
        queryKey: queryKeys.transactions.detail(id),
      });
      // Invalidar cache geral
      invalidateQueries.transactions();
      invalidateQueries.calculations();
      toast.success("Transação deletada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao deletar transação:", error);
      toast.error("Erro ao deletar transação");
    },
  });
}

// Hook para buscar transações recentes
export function useRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: [...queryKeys.transactions.lists(), "recent", limit],
    queryFn: async () => {
      const result = await financialService.getTransactions({ 
        limit, 
        page: 1 
      });
      return result.data.items || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para dados recentes
  });
}

// Hook para buscar transações por categoria
export function useTransactionsByCategory() {
  return useQuery({
    queryKey: [...queryKeys.transactions.lists(), "by-category"],
    queryFn: async () => {
      const result = await financialService.getTransactions();
      const transactions = result.data.items;
      const categoryMap = new Map<string, Transaction[]>();

      transactions.forEach((transaction) => {
        const category = transaction.category || "Sem categoria";
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(transaction);
      });

      return Object.fromEntries(categoryMap);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para estatísticas de transações
export function useTransactionStats(period?: { start: string; end: string }) {
  return useQuery({
    queryKey: [
      ...queryKeys.calculations.financial(),
      "transaction-stats",
      period,
    ],
    queryFn: async () => {
      const filters: TransactionFilters = {};
      if (period) {
        filters.startDate = period.start;
        filters.endDate = period.end;
      }

      const result = await financialService.getTransactions(filters);
      const transactions = result.data.items;

      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const balance = income - expenses;

      return {
        income,
        expenses,
        balance,
        transactionCount: transactions.length,
        averageTransaction:
          transactions.length > 0
            ? (income + expenses) / transactions.length
            : 0,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}
