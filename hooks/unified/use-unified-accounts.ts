"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logComponents } from "../../lib/logger";
import { financialService } from "../../lib/services";
import { unifiedQueryKeys, unifiedInvalidation } from "../../lib/react-query/unified-query-client";
import { getSyncMiddleware } from "../../lib/middleware/sync-middleware";
import type { Account } from "../../lib/storage";

// Tipos para criação e atualização
export interface CreateAccountData {
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "cash";
  balance: number;
  currency?: string;
  description?: string;
  isActive?: boolean;
}

export interface AccountFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
}

// Hook para buscar todas as contas
export function useUnifiedAccounts(filters?: AccountFilters) {
  return useQuery({
    queryKey: unifiedQueryKeys.accounts.list(filters),
    queryFn: async () => {
      const result = await financialService.getAccounts(filters);
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para buscar uma conta específica
export function useUnifiedAccount(id: string) {
  return useQuery({
    queryKey: unifiedQueryKeys.accounts.detail(id),
    queryFn: async () => {
      const result = await financialService.getAccountById(id);
      return result.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos para detalhes
  });
}

// Hook para resumo de contas (saldos totais)
export function useUnifiedAccountsSummary() {
  return useQuery({
    queryKey: unifiedQueryKeys.accounts.summary(),
    queryFn: async () => {
      const result = await financialService.getAccounts();
      const accounts = result.data.items || [];
      
      const summary = {
        totalBalance: 0,
        totalAccounts: accounts.length,
        activeAccounts: 0,
        byType: {} as Record<string, { count: number; balance: number }>,
      };

      accounts.forEach((account) => {
        const balance = Number(account.balance || 0);
        summary.totalBalance += balance;
        
        if (account.isActive !== false) {
          summary.activeAccounts++;
        }

        const type = account.type || "other";
        if (!summary.byType[type]) {
          summary.byType[type] = { count: 0, balance: 0 };
        }
        summary.byType[type].count++;
        summary.byType[type].balance += balance;
      });

      return summary;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para resumo
  });
}

// Hook para contas ativas
export function useUnifiedActiveAccounts() {
  return useQuery({
    queryKey: unifiedQueryKeys.accounts.active(),
    queryFn: async () => {
      const result = await financialService.getAccounts({ isActive: true });
      return result.data.items || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Hook para saldo total
export function useUnifiedTotalBalance() {
  return useQuery({
    queryKey: unifiedQueryKeys.accounts.totalBalance(),
    queryFn: async () => {
      const result = await financialService.getAccounts();
      const accounts = result.data.items || [];
      
      return accounts.reduce((total, account) => {
        return total + Number(account.balance || 0);
      }, 0);
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para saldo total
  });
}

// Hook para criar conta com invalidação robusta
export function useUnifiedCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: CreateAccountData) => {
      const result = await financialService.createAccount(account);
      return result.data;
    },
    onSuccess: async (newAccount) => {
      try {
        // 1. Adicionar ao cache de detalhes imediatamente
        queryClient.setQueryData(
          unifiedQueryKeys.accounts.detail(newAccount.id),
          newAccount
        );

        // 2. Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'account',
          action: 'create',
          entityId: newAccount.id,
          metadata: { account: newAccount }
        });

        toast.success("Conta criada com sucesso!");
        logComponents.info("Conta criada e sincronização iniciada:", newAccount.id);
      } catch (error) {
        logComponents.error("Erro na sincronização após criar conta:", error);
        // Mesmo com erro de sincronização, a conta foi criada
        toast.success("Conta criada! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao criar conta";
      toast.error(message);
      logComponents.error("Erro ao criar conta:", error);
    },
  });
}

// Hook para atualizar conta
export function useUnifiedUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAccountData> }) => {
      const result = await financialService.updateAccount(id, data);
      return result.data;
    },
    onSuccess: async (updatedAccount, { id }) => {
      try {
        // 1. Atualizar cache específico
        queryClient.setQueryData(
          unifiedQueryKeys.accounts.detail(id),
          updatedAccount
        );

        // 2. Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'account',
          action: 'update',
          entityId: updatedAccount.id,
          metadata: { account: updatedAccount }
        });

        toast.success("Conta atualizada com sucesso!");
        logComponents.info("Conta atualizada:", updatedAccount.id);
      } catch (error) {
        logComponents.error("Erro na sincronização após atualizar conta:", error);
        toast.success("Conta atualizada! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao atualizar conta";
      toast.error(message);
      logComponents.error("Erro ao atualizar conta:", error);
    },
  });
}

// Hook para deletar conta
export function useUnifiedDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await financialService.deleteAccount(id);
      return id;
    },
    onSuccess: async (_, id) => {
      try {
        // Remover do cache específico
        queryClient.removeQueries({
          queryKey: unifiedQueryKeys.accounts.detail(id)
        });

        // Notificar middleware de sincronização
        const syncMiddleware = getSyncMiddleware();
        syncMiddleware.addSyncEvent({
          type: 'account',
          action: 'delete',
          entityId: id,
          metadata: { deletedId: id }
        });

        toast.success("Conta excluída com sucesso!");
        logComponents.info("Conta excluída:", id);
      } catch (error) {
        logComponents.error("Erro na sincronização após excluir conta:", error);
        toast.success("Conta excluída! Sincronizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao deletar conta";
      toast.error(message);
      logComponents.error("Erro ao deletar conta:", error);
    },
  });
}

// Hook para transferência entre contas
export function useUnifiedTransferBetweenAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      fromAccountId, 
      toAccountId, 
      amount, 
      description 
    }: { 
      fromAccountId: string; 
      toAccountId: string; 
      amount: number; 
      description?: string; 
    }) => {
      const result = await financialService.transferBetweenAccounts({
        fromAccountId,
        toAccountId,
        amount,
        description: description || "Transferência entre contas"
      });
      return result.data;
    },
    onSuccess: async () => {
      try {
        // Invalidação completa após transferência
        await Promise.all([
          unifiedInvalidation.accounts(),
          unifiedInvalidation.transactions(),
          unifiedInvalidation.dashboard(),
        ]);

        // Refetch forçado de dados críticos
        await Promise.all([
          queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
          queryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.totalBalance() }),
          queryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
        ]);

        toast.success("Transferência realizada com sucesso!");
        logComponents.info("Transferência realizada e cache invalidado");
      } catch (error) {
        logComponents.error("Erro na invalidação de cache após transferência:", error);
        toast.success("Transferência realizada! Atualizando dados...");
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao realizar transferência";
      toast.error(message);
      logComponents.error("Erro ao realizar transferência:", error);
    },
  });
}

// Exportar tipos
export type { Account, CreateAccountData, AccountFilters };