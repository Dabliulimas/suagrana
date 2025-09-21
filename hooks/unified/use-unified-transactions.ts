"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logComponents } from "../../lib/logger";
import { financialService } from "../../lib/services";
import { unifiedQueryKeys, unifiedInvalidation } from "../../lib/react-query/unified-query-client";
import { getSyncMiddleware } from "../../lib/middleware/sync-middleware";
import type { Transaction } from "../../lib/storage";

// Tipos para criação e atualização
export interface CreateTransactionData {
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer" | "shared";
  category: string;
  date: string;
  accountId?: string;
  notes?: string;
  tags?: string[];
}

export interface TransactionFilters {
  type?: string;
  category?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  page?: number;
}

// Hook para buscar todas as transações
export function useUnifiedTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: unifiedQueryKeys.transactions.list(filters),
    queryFn: async () => {
      const result = await financialService.getTransactions(filters);
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para buscar uma transação específica
export function useUnifiedTransaction(id: string) {
  return useQuery({
    queryKey: unifiedQueryKeys.transactions.detail(id),
    queryFn: async () => {
      const result = await financialService.getTransactionById(id);
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos para detalhes
  });
}

// Hook para buscar transações recentes
export function useUnifiedRecentTransactions(limit: number = 10) {
  return useQuery({
    queryKey: unifiedQueryKeys.transactions.recent(limit),
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

// Hook para estatísticas de transações
export function useUnifiedTransactionStats() {
  return useQuery({
    queryKey: unifiedQueryKeys.transactions.stats(),
    queryFn: async () => {
      const result = await financialService.getTransactions();
      const transactions = result.data.items || [];
      
      const totalIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === "expense" || t.type === "shared")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      return {
        totalTransactions: transactions.length,
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        thisMonth: {
          transactions: transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const now = new Date();
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
          }).length
        }
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook para criar transação com invalidação robusta
export function useUnifiedCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: CreateTransactionData) => {
      const result = await financialService.createTransaction(transaction);
      return result.data;
    },
    onSuccess: async (newTransaction) => {
      try {
        // 1. Adicionar ao cache de detalhes imediatamente
        queryClient.setQueryData(
          unifiedQueryKeys.transactions.detail(newTransaction.id),
          newTransaction
        );

        // 2. Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'transaction',
          action: 'create',
          entityId: newTransaction.id,
          metadata: { transaction: newTransaction }
        });

        toast.success("Transação criada com sucesso!");
        logComponents.info("Transação criada e sincronização iniciada:", newTransaction.id);
      } catch (error) {
        logComponents.error("Erro na sincronização após criar transação:", error);
        // Mesmo com erro de sincronização, a transação foi criada
        toast.success("Transação criada! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao criar transação";
      toast.error(message);
      logComponents.error("Erro ao criar transação:", error);
    },
  });
}

// Hook para atualizar transação
export function useUnifiedUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Transaction> }) => {
      const result = await financialService.updateTransaction(id, data);
      return result.data;
    },
    onSuccess: async (updatedTransaction) => {
      try {
        // Atualizar cache específico
        queryClient.setQueryData(
          unifiedQueryKeys.transactions.detail(updatedTransaction.id),
          updatedTransaction
        );

        // Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'transaction',
          action: 'update',
          entityId: updatedTransaction.id,
          metadata: { transaction: updatedTransaction }
        });

        toast.success("Transação atualizada com sucesso!");
        logComponents.info("Transação atualizada:", updatedTransaction.id);
      } catch (error) {
        logComponents.error("Erro na sincronização após atualizar transação:", error);
        toast.success("Transação atualizada! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao atualizar transação";
      toast.error(message);
      logComponents.error("Erro ao atualizar transação:", error);
    },
  });
}

// Hook para deletar transação
export function useUnifiedDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await financialService.deleteTransaction(id);
      return id;
    },
    onSuccess: async (deletedId) => {
      try {
        // Remover do cache específico
        queryClient.removeQueries({
          queryKey: unifiedQueryKeys.transactions.detail(deletedId)
        });

        // Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'transaction',
          action: 'delete',
          entityId: deletedId,
          metadata: { deletedId }
        });

        toast.success("Transação excluída com sucesso!");
        logComponents.info("Transação excluída:", deletedId);
      } catch (error) {
        logComponents.error("Erro na sincronização após excluir transação:", error);
        toast.success("Transação excluída! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao excluir transação";
      toast.error(message);
      logComponents.error("Erro ao excluir transação:", error);
    },
  });
}

// Hook para buscar transações por categoria
export function useUnifiedTransactionsByCategory() {
  return useQuery({
    queryKey: unifiedQueryKeys.transactions.byCategory(),
    queryFn: async () => {
      const result = await financialService.getTransactions();
      const transactions = result.data.items || [];
      
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

// Exportar tipos
export type { Transaction, CreateTransactionData, TransactionFilters };