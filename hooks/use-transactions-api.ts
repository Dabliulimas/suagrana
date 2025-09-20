"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../../lib/logger";
import { TransactionsService } from "../lib/services/transactions-service";
import { dataService } from "../lib/services/data-service";
import type { Transaction } from "../lib/types";
import { toast } from "sonner";

interface UseTransactionsApiOptions {
  enableSync?: boolean; // Sincronizar com backend
  fallbackToLocal?: boolean; // Usar localStorage como fallback
  autoRefresh?: boolean; // Atualizar automaticamente
  refreshInterval?: number; // Intervalo de atualização em ms
}

interface UseTransactionsApiReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  // Operações CRUD
  createTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Transaction | null>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>,
  ) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  // Operações de busca
  searchTransactions: (filters: any) => Promise<Transaction[]>;
  getStats: (period?: "month" | "year" | "all") => Promise<any>;
  // Controle
  refresh: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  isOnline: boolean;
}

export function useTransactionsApi(
  options: UseTransactionsApiOptions = {},
): UseTransactionsApiReturn {
  const {
    enableSync = true,
    fallbackToLocal = true,
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
  } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Verificar conectividade
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Carregar dados do backend ou localStorage
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (enableSync && isOnline) {
        // Tentar carregar do backend
        try {
          const backendTransactions = await TransactionsService.getAll();
          setTransactions(backendTransactions);

          // Salvar no banco de dados local como backup
          if (fallbackToLocal) {
            await dataService.saveTransactionsBackup(backendTransactions);
          }

          return;
        } catch (backendError) {
          console.warn(
            "Erro ao carregar do backend, usando dados locais:",
            backendError,
          );
          setError("Conectividade limitada - usando dados locais");
        }
      }

      // Fallback para banco de dados local
      if (fallbackToLocal) {
        const localTransactions = await dataService.getTransactions();
        setTransactions(localTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar transações";
      setError(errorMessage);
      logComponents.error("Erro ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  }, [enableSync, isOnline, fallbackToLocal]);

  // Sincronizar dados locais com backend
  const syncWithBackend = useCallback(async () => {
    if (!enableSync || !isOnline) return;

    try {
      const localTransactions = await dataService.getTransactions();
      const backendTransactions = await TransactionsService.getAll();

      // Identificar transações que existem apenas localmente
      const localOnlyTransactions = localTransactions.filter(
        (local) =>
          !backendTransactions.find((backend) => backend.id === local.id),
      );

      // Enviar transações locais para o backend
      for (const transaction of localOnlyTransactions) {
        try {
          await TransactionsService.create(transaction);
        } catch (error) {
          logComponents.error("Erro ao sincronizar transação:", transaction.id,
            error,
          );
        }
      }

      // Recarregar dados após sincronização
      await loadTransactions();
      toast.success("Dados sincronizados com sucesso");
    } catch (error) {
      logComponents.error("Erro na sincronização:", error);
      toast.error("Erro ao sincronizar dados");
    }
  }, [enableSync, isOnline, loadTransactions]);

  // Criar transação
  const createTransaction = useCallback(
    async (
      transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    ): Promise<Transaction | null> => {
      try {
        let newTransaction: Transaction;

        if (enableSync && isOnline) {
          // Tentar criar no backend
          try {
            newTransaction = await TransactionsService.create(transactionData);
            toast.success("Transação criada com sucesso");
          } catch (backendError) {
            console.warn(
              "Erro ao criar no backend, salvando localmente:",
              backendError,
            );
            // Criar localmente se backend falhar
            newTransaction = await dataService.saveTransaction(transactionData);
            toast.warning(
              "Transação salva localmente - será sincronizada quando possível",
            );
          }
        } else {
          // Criar apenas localmente
          newTransaction = await dataService.saveTransaction(transactionData);
          toast.success("Transação salva localmente");
        }

        // Atualizar estado local
        setTransactions((prev) => [...prev, newTransaction]);
        return newTransaction;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao criar transação";
        toast.error(errorMessage);
        logComponents.error("Erro ao criar transação:", error);
        return null;
      }
    },
    [enableSync, isOnline],
  );

  // Atualizar transação
  const updateTransaction = useCallback(
    async (
      id: string,
      updates: Partial<Transaction>,
    ): Promise<Transaction | null> => {
      try {
        let updatedTransaction: Transaction;

        if (enableSync && isOnline) {
          // Tentar atualizar no backend
          try {
            updatedTransaction = await TransactionsService.update(id, updates);
            toast.success("Transação atualizada com sucesso");
          } catch (backendError) {
            console.warn(
              "Erro ao atualizar no backend, atualizando localmente:",
              backendError,
            );
            // Atualizar localmente se backend falhar
            updatedTransaction = await dataService.updateTransaction(id, updates);
            if (!updatedTransaction) {
              throw new Error("Falha ao atualizar transação localmente");
            }
            toast.warning(
              "Transação atualizada localmente - será sincronizada quando possível",
            );
          }
        } else {
          // Atualizar apenas localmente
          updatedTransaction = await dataService.updateTransaction(id, updates);
          if (!updatedTransaction) {
            throw new Error("Falha ao atualizar transação localmente");
          }
          toast.success("Transação atualizada localmente");
        }

        // Atualizar estado local
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updatedTransaction : t)),
        );
        return updatedTransaction;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro ao atualizar transação";
        toast.error(errorMessage);
        logComponents.error("Erro ao atualizar transação:", error);
        return null;
      }
    },
    [enableSync, isOnline],
  );

  // Deletar transação
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        if (enableSync && isOnline) {
          // Tentar deletar no backend
          try {
            await TransactionsService.delete(id);
            toast.success("Transação excluída com sucesso");
          } catch (backendError) {
            console.warn(
              "Erro ao deletar no backend, deletando localmente:",
              backendError,
            );
            // Deletar localmente se backend falhar
            await dataService.deleteTransaction(id);
            toast.warning(
              "Transação excluída localmente - será sincronizada quando possível",
            );
          }
        } else {
          // Deletar apenas localmente
          await dataService.deleteTransaction(id);
          toast.success("Transação excluída localmente");
        }

        // Atualizar estado local
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao excluir transação";
        toast.error(errorMessage);
        logComponents.error("Erro ao excluir transação:", error);
        return false;
      }
    },
    [enableSync, isOnline],
  );

  // Buscar transações com filtros
  const searchTransactions = useCallback(
    async (filters: any): Promise<Transaction[]> => {
      try {
        if (enableSync && isOnline) {
          const result = await TransactionsService.search(filters);
          return result.data;
        } else {
          // Implementar busca local via DataService
          return await dataService.searchTransactions(filters);
        }
      } catch (error) {
        logComponents.error("Erro ao buscar transações:", error);
        return [];
      }
    },
    [enableSync, isOnline],
  );

  // Obter estatísticas
  const getStats = useCallback(
    async (period?: "month" | "year" | "all") => {
      try {
        if (enableSync && isOnline) {
          return await TransactionsService.getStats(period);
        } else {
          // Calcular estatísticas localmente via DataService
          return await dataService.getStats(period);
        }
      } catch (error) {
        logComponents.error("Erro ao obter estatísticas:", error);
        return null;
      }
    },
    [enableSync, isOnline],
  );

  // Atualizar dados
  const refresh = useCallback(async () => {
    await loadTransactions();
  }, [loadTransactions]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isOnline) return;

    const interval = setInterval(() => {
      loadTransactions();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isOnline, refreshInterval, loadTransactions]);

  // Sincronizar quando voltar online
  useEffect(() => {
    if (isOnline && enableSync) {
      syncWithBackend();
    }
  }, [isOnline, enableSync, syncWithBackend]);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    searchTransactions,
    getStats,
    refresh,
    syncWithBackend,
    isOnline,
  };
}

export default useTransactionsApi;
