"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../../../lib/logger";
import { getDataLayer } from "../../../lib/data-layer/data-layer";
import type { Account } from "../../../lib/data-layer/types";
import type {
  UseAccountsReturn,
  HookOptions,
  AccountFilters,
  AccountStats,
  HookErrorType,
} from "../hooks/types/financial-hooks";
import { toast } from "sonner";

/**
 * Hook consolidado para gerenciamento de contas
 * Combina todas as funcionalidades das implementações existentes
 */
export function useAccounts(options: HookOptions = {}): UseAccountsReturn {
  const {
    enableSync = true,
    fallbackToLocal = true,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minuto
  } = options;

  // Estado principal
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // Função para tratar erros
  const handleError = useCallback((err: any, operation: string) => {
    const errorMessage =
      err instanceof Error ? err.message : `Erro em ${operation}`;
    setError(errorMessage);
    logComponents.error("Erro em ${operation}:", err);
    return errorMessage;
  }, []);

  // Carregar contas
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dataLayer = getDataLayer();
      const accountsData = await dataLayer.getAll("accounts");

      setAccounts(accountsData);
    } catch (err) {
      handleError(err, "carregar contas");
      // Fallback para dados vazios em caso de erro
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Criar conta
  const create = useCallback(
    async (
      accountData: Omit<Account, "id" | "createdAt" | "updatedAt">,
    ): Promise<Account> => {
      try {
        const dataLayer = getDataLayer();
        const newAccount = await dataLayer.create("accounts", accountData);

        setAccounts((prev) => [...prev, newAccount]);
        toast.success("Conta criada com sucesso");

        return newAccount;
      } catch (err) {
        const errorMessage = handleError(err, "criar conta");
        toast.error(errorMessage);
        throw err;
      }
    },
    [handleError],
  );

  // Atualizar conta
  const update = useCallback(
    async (id: string, updates: Partial<Account>): Promise<Account> => {
      try {
        const dataLayer = getDataLayer();
        const updatedAccount = await dataLayer.update("accounts", id, updates);

        setAccounts((prev) =>
          prev.map((account) => (account.id === id ? updatedAccount : account)),
        );
        toast.success("Conta atualizada com sucesso");

        return updatedAccount;
      } catch (err) {
        const errorMessage = handleError(err, "atualizar conta");
        toast.error(errorMessage);
        throw err;
      }
    },
    [handleError],
  );

  // Deletar conta
  const deleteAccount = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const dataLayer = getDataLayer();
        await dataLayer.delete("accounts", id);

        setAccounts((prev) => prev.filter((account) => account.id !== id));
        toast.success("Conta excluída com sucesso");

        return true;
      } catch (err) {
        const errorMessage = handleError(err, "excluir conta");
        toast.error(errorMessage);
        return false;
      }
    },
    [handleError],
  );

  // Atualizar saldo
  const updateBalance = useCallback(
    async (id: string, newBalance: number): Promise<Account> => {
      return await update(id, { balance: newBalance });
    },
    [update],
  );

  // Transferir entre contas
  const transferBetweenAccounts = useCallback(
    async (
      fromId: string,
      toId: string,
      amount: number,
      description?: string,
    ): Promise<boolean> => {
      try {
        const fromAccount = accounts.find((a) => a.id === fromId);
        const toAccount = accounts.find((a) => a.id === toId);

        if (!fromAccount || !toAccount) {
          throw new Error("Conta não encontrada");
        }

        if (fromAccount.balance < amount) {
          throw new Error("Saldo insuficiente");
        }

        // Atualizar saldos
        await update(fromId, { balance: fromAccount.balance - amount });
        await update(toId, { balance: toAccount.balance + amount });

        toast.success("Transferência realizada com sucesso");
        return true;
      } catch (err) {
        const errorMessage = handleError(err, "transferir entre contas");
        toast.error(errorMessage);
        return false;
      }
    },
    [accounts, update, handleError],
  );

  // Alternar status da conta
  const toggleAccountStatus = useCallback(
    async (id: string): Promise<Account> => {
      const account = accounts.find((a) => a.id === id);
      if (!account) {
        throw new Error("Conta não encontrada");
      }

      const newStatus = account.status === "active" ? "inactive" : "active";
      return await update(id, { status: newStatus });
    },
    [accounts, update],
  );

  // Buscar contas com filtros
  const searchAccounts = useCallback(
    async (filters: AccountFilters): Promise<Account[]> => {
      try {
        return accounts.filter((account) => {
          if (filters.type && account.type !== filters.type) return false;
          if (filters.status && account.status !== filters.status) return false;
          if (
            filters.bankName &&
            !account.bankName
              ?.toLowerCase()
              .includes(filters.bankName.toLowerCase())
          )
            return false;
          if (
            filters.minBalance !== undefined &&
            account.balance < filters.minBalance
          )
            return false;
          if (
            filters.maxBalance !== undefined &&
            account.balance > filters.maxBalance
          )
            return false;
          return true;
        });
      } catch (err) {
        handleError(err, "buscar contas");
        return [];
      }
    },
    [accounts, handleError],
  );

  // Obter estatísticas
  const getStats = useCallback(async (): Promise<AccountStats> => {
    try {
      const totalBalance = accounts.reduce(
        (sum, account) => sum + account.balance,
        0,
      );
      const activeAccounts = accounts.filter(
        (account) => account.status === "active",
      ).length;

      const accountsByType: Record<string, number> = {};
      const balanceByType: Record<string, number> = {};

      accounts.forEach((account) => {
        accountsByType[account.type] = (accountsByType[account.type] || 0) + 1;
        balanceByType[account.type] =
          (balanceByType[account.type] || 0) + account.balance;
      });

      return {
        totalBalance,
        totalAccounts: accounts.length,
        activeAccounts,
        accountsByType,
        balanceByType,
      };
    } catch (err) {
      handleError(err, "obter estatísticas");
      return {
        totalBalance: 0,
        totalAccounts: 0,
        activeAccounts: 0,
        accountsByType: {},
        balanceByType: {},
      };
    }
  }, [accounts, handleError]);

  // Atualizar dados
  const refresh = useCallback(async () => {
    await loadAccounts();
  }, [loadAccounts]);

  // Sincronizar com backend
  const syncWithBackend = useCallback(async () => {
    if (!enableSync || !isOnline) return;

    try {
      await loadAccounts();
      toast.success("Contas sincronizadas com sucesso");
    } catch (err) {
      handleError(err, "sincronizar contas");
      toast.error("Erro ao sincronizar contas");
    }
  }, [enableSync, isOnline, loadAccounts, handleError]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isOnline) return;

    const interval = setInterval(() => {
      loadAccounts();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isOnline, refreshInterval, loadAccounts]);

  // Sincronizar quando voltar online
  useEffect(() => {
    if (isOnline && enableSync) {
      syncWithBackend();
    }
  }, [isOnline, enableSync, syncWithBackend]);

  return {
    accounts,
    isLoading,
    error,
    create,
    update,
    delete: deleteAccount,
    refresh,
    updateBalance,
    transferBetweenAccounts,
    toggleAccountStatus,
    searchAccounts,
    getStats,
    isOnline,
    syncWithBackend,
  };
}
