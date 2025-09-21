"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logComponents } from "../lib/logger";

// Tipos
interface Account {
  id: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
  balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAccountData {
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
  balance: number;
  currency: string;
  description?: string;
}

// Query Keys
const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filters?: any) => [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountKeys.details(), id] as const,
  summary: () => [...accountKeys.all, 'summary'] as const,
};

// API Functions
const accountApi = {
  getAll: async (): Promise<{ accounts: Account[]; summary: any }> => {
    const response = await fetch('/api/accounts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar contas: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar contas');
    }

    return result.data;
  },

  getById: async (id: string): Promise<Account> => {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar conta: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar conta');
    }

    return result.data.account;
  },

  create: async (data: CreateAccountData): Promise<Account> => {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar conta: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao criar conta');
    }

    return result.data.account;
  },

  update: async (id: string, data: Partial<CreateAccountData>): Promise<Account> => {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar conta: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar conta');
    }

    return result.data.account;
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar conta: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao deletar conta');
    }
  },
};

// Hooks

/**
 * Hook para buscar todas as contas
 */
export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: accountApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para buscar uma conta específica
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: accountKeys.detail(id),
    queryFn: () => accountApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar resumo das contas
 */
export function useAccountsSummary() {
  return useQuery({
    queryKey: accountKeys.summary(),
    queryFn: async () => {
      const result = await accountApi.getAll();
      const accounts = result.accounts;

      const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
      const activeAccounts = accounts.filter(account => account.isActive);
      
      const byType = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
          acc[account.type] = { count: 0, balance: 0 };
        }
        acc[account.type].count++;
        acc[account.type].balance += account.balance;
        return acc;
      }, {} as Record<string, { count: number; balance: number }>);

      return {
        totalBalance,
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        byType,
        accounts: activeAccounts,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para criar conta
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountApi.create,
    onSuccess: (newAccount) => {
      // Invalidar listas de contas
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      
      // Invalidar resumo
      queryClient.invalidateQueries({ queryKey: accountKeys.summary() });
      
      // Adicionar ao cache de detalhes
      queryClient.setQueryData(
        accountKeys.detail(newAccount.id),
        newAccount
      );

      toast.success("Conta criada com sucesso!");
      logComponents.info("Conta criada:", newAccount.id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao criar conta";
      toast.error(message);
      logComponents.error("Erro ao criar conta:", error);
    },
  });
}

/**
 * Hook para atualizar conta
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountData> }) =>
      accountApi.update(id, data),
    onSuccess: (updatedAccount, { id }) => {
      // Atualizar cache específico
      queryClient.setQueryData(
        accountKeys.detail(id),
        updatedAccount
      );
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      
      // Invalidar resumo
      queryClient.invalidateQueries({ queryKey: accountKeys.summary() });

      toast.success("Conta atualizada com sucesso!");
      logComponents.info("Conta atualizada:", id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao atualizar conta";
      toast.error(message);
      logComponents.error("Erro ao atualizar conta:", error);
    },
  });
}

/**
 * Hook para deletar conta
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: accountApi.delete,
    onSuccess: (_, id) => {
      // Remover do cache específico
      queryClient.removeQueries({ queryKey: accountKeys.detail(id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
      
      // Invalidar resumo
      queryClient.invalidateQueries({ queryKey: accountKeys.summary() });
      
      // Invalidar transações (podem estar relacionadas)
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      toast.success("Conta deletada com sucesso!");
      logComponents.info("Conta deletada:", id);
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao deletar conta";
      toast.error(message);
      logComponents.error("Erro ao deletar conta:", error);
    },
  });
}

// Exportar tipos
export type { Account, CreateAccountData };