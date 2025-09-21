"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Account } from "@/lib/types";
import { queryKeys, useGranularInvalidation } from "./use-granular-data";

export function useGranularAccounts() {
  const { invalidateAccountRelated } = useGranularInvalidation();

  // Query para todas as contas
  const useAccountsList = (filters?: any) => {
    return useQuery({
      queryKey: queryKeys.accounts.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const response = await fetch(`/api/accounts?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao buscar contas');
        const result = await response.json();
        return result.data || result;
      },
      staleTime: 60000, // 1 minuto
      gcTime: 10 * 60 * 1000, // 10 minutos
    });
  };

  // Query para detalhes de uma conta específica
  const useAccountDetail = (id: string) => {
    return useQuery({
      queryKey: queryKeys.accounts.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/accounts/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar detalhes da conta');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
      enabled: !!id,
    });
  };

  // Query para saldo de uma conta específica
  const useAccountBalance = (id: string) => {
    return useQuery({
      queryKey: queryKeys.accounts.balance(id),
      queryFn: async () => {
        const response = await fetch(`/api/accounts/${id}/balance`);
        if (!response.ok) throw new Error('Erro ao buscar saldo da conta');
        return response.json();
      },
      staleTime: 30000, // 30 segundos
      gcTime: 5 * 60 * 1000,
      enabled: !!id,
    });
  };

  // Query para resumo de todas as contas
  const useAccountsSummary = () => {
    return useQuery({
      queryKey: queryKeys.accounts.summary(),
      queryFn: async () => {
        const response = await fetch('/api/accounts/summary');
        if (!response.ok) throw new Error('Erro ao buscar resumo das contas');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Mutação para criar conta
  const useCreateAccount = () => {
    return useMutation({
      mutationFn: async (accountData: Omit<Account, 'id'>) => {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData),
        });
        if (!response.ok) throw new Error('Erro ao criar conta');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateAccountRelated(variables);
      },
    });
  };

  // Mutação para atualizar conta
  const useUpdateAccount = () => {
    return useMutation({
      mutationFn: async ({ id, ...accountData }: Partial<Account> & { id: string }) => {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accountData),
        });
        if (!response.ok) throw new Error('Erro ao atualizar conta');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateAccountRelated(variables);
      },
    });
  };

  // Mutação para deletar conta
  const useDeleteAccount = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao deletar conta');
        return response.json();
      },
      onSuccess: () => {
        invalidateAccountRelated();
      },
    });
  };

  return {
    useAccountsList,
    useAccountDetail,
    useAccountBalance,
    useAccountsSummary,
    useCreateAccount,
    useUpdateAccount,
    useDeleteAccount,
  };
}