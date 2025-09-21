import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Transaction, Account, Goal } from '@/types';
import { useSelectiveInvalidation } from './use-selective-invalidation';

/**
 * Sistema centralizado de mutações granulares
 * Cada mutação invalida apenas as queries específicas relacionadas
 * usando o sistema de invalidação seletiva
 */

export function useGranularMutations() {
  const queryClient = useQueryClient();
  const {
    invalidateTransactions,
    invalidateAccounts,
    invalidateGoals,
    smartInvalidate,
  } = useSelectiveInvalidation();

  // Mutações de Transações
  const createTransaction = useMutation({
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
      smartInvalidate('transactions', 'create');
      toast.success('Transação criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar transação');
    },
  });

  const updateTransaction = useMutation({
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
      smartInvalidate('transactions', 'update', variables.id);
      toast.success('Transação atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar transação');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar transação');
      return response.json();
    },
    onSuccess: (data, variables) => {
      smartInvalidate('transactions', 'delete', variables);
      toast.success('Transação deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar transação');
    },
  });

  // Mutações de Contas
  const createAccount = useMutation({
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
      smartInvalidate('accounts', 'create');
      toast.success('Conta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conta');
    },
  });

  const updateAccount = useMutation({
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
      smartInvalidate('accounts', 'update', variables.id);
      toast.success('Conta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar conta');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar conta');
      return response.json();
    },
    onSuccess: (data, variables) => {
      smartInvalidate('accounts', 'delete', variables);
      toast.success('Conta deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar conta');
    },
  });

  // Mutações de Metas
  const createGoal = useMutation({
    mutationFn: async (goalData: Omit<Goal, 'id'>) => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Erro ao criar meta');
      return response.json();
    },
    onSuccess: (data, variables) => {
      smartInvalidate('goals', 'create');
      toast.success('Meta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar meta');
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...goalData }: Partial<Goal> & { id: string }) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Erro ao atualizar meta');
      return response.json();
    },
    onSuccess: (data, variables) => {
      smartInvalidate('goals', 'update', variables.id);
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar meta');
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar meta');
      return response.json();
    },
    onSuccess: (data, variables) => {
      smartInvalidate('goals', 'delete', variables);
      toast.success('Meta deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar meta');
    },
  });

  // Mutação para transferência entre contas (afeta múltiplas entidades)
  const transferBetweenAccounts = useMutation({
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
      const response = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAccountId, toAccountId, amount, description }),
      });
      if (!response.ok) throw new Error('Erro ao realizar transferência');
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Transferência afeta tanto contas quanto transações
      invalidateAccounts('related', variables.fromAccountId);
      invalidateAccounts('related', variables.toAccountId);
      invalidateTransactions('related');
      toast.success('Transferência realizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao realizar transferência');
    },
  });

  return {
    // Transações
    createTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Contas
    createAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    
    // Metas
    createGoal,
    updateGoal,
    deleteGoal,
    
    // Funções de invalidação manual (para casos especiais)
    invalidateTransactionRelated,
    invalidateAccountRelated,
    invalidateGoalRelated,
  };
}