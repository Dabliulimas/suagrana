import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGranularMutations } from '@/hooks/use-granular-mutations';
import { useGranularCards } from '@/hooks/use-granular-cards';

/**
 * Exemplo de como usar as mutações granulares
 * Este componente demonstra como criar, atualizar e deletar dados
 * com invalidação seletiva automática
 */

export function GranularMutationsExample() {
  const [transactionData, setTransactionData] = useState({
    description: '',
    amount: '',
    category: 'alimentacao',
    type: 'expense' as 'income' | 'expense',
    accountId: '',
  });

  const [accountData, setAccountData] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'investment',
    balance: '',
  });

  const [goalData, setGoalData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
  });

  // Hooks de mutações granulares
  const {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAccount,
    updateAccount,
    deleteAccount,
    createGoal,
    updateGoal,
    deleteGoal,
    transferBetweenAccounts,
  } = useGranularMutations();

  // Hook para dados (para demonstrar a atualização automática)
  const { data: cards, isLoading } = useGranularCards();

  const handleCreateTransaction = async () => {
    if (!transactionData.description || !transactionData.amount) return;

    await createTransaction.mutateAsync({
      description: transactionData.description,
      amount: parseFloat(transactionData.amount),
      category: transactionData.category,
      type: transactionData.type,
      accountId: transactionData.accountId || 'default-account',
      date: new Date().toISOString(),
    });

    // Limpar formulário após sucesso
    setTransactionData({
      description: '',
      amount: '',
      category: 'alimentacao',
      type: 'expense',
      accountId: '',
    });
  };

  const handleCreateAccount = async () => {
    if (!accountData.name || !accountData.balance) return;

    await createAccount.mutateAsync({
      name: accountData.name,
      type: accountData.type,
      balance: parseFloat(accountData.balance),
      currency: 'BRL',
    });

    // Limpar formulário após sucesso
    setAccountData({
      name: '',
      type: 'checking',
      balance: '',
    });
  };

  const handleCreateGoal = async () => {
    if (!goalData.name || !goalData.targetAmount || !goalData.deadline) return;

    await createGoal.mutateAsync({
      name: goalData.name,
      targetAmount: parseFloat(goalData.targetAmount),
      currentAmount: parseFloat(goalData.currentAmount),
      deadline: goalData.deadline,
      category: 'savings',
    });

    // Limpar formulário após sucesso
    setGoalData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
    });
  };

  const handleTransfer = async () => {
    // Exemplo de transferência entre contas
    await transferBetweenAccounts.mutateAsync({
      fromAccountId: 'account-1',
      toAccountId: 'account-2',
      amount: 100,
      description: 'Transferência de exemplo',
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Criar Transação */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Transação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Descrição"
              value={transactionData.description}
              onChange={(e) => setTransactionData(prev => ({ ...prev, description: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Valor"
              value={transactionData.amount}
              onChange={(e) => setTransactionData(prev => ({ ...prev, amount: e.target.value }))}
            />
            <select
              value={transactionData.type}
              onChange={(e) => setTransactionData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              className="w-full p-2 border rounded"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
            <Button
              onClick={handleCreateTransaction}
              disabled={createTransaction.isPending}
              className="w-full"
            >
              {createTransaction.isPending ? 'Criando...' : 'Criar Transação'}
            </Button>
          </CardContent>
        </Card>

        {/* Criar Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nome da conta"
              value={accountData.name}
              onChange={(e) => setAccountData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Saldo inicial"
              value={accountData.balance}
              onChange={(e) => setAccountData(prev => ({ ...prev, balance: e.target.value }))}
            />
            <select
              value={accountData.type}
              onChange={(e) => setAccountData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full p-2 border rounded"
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimento</option>
            </select>
            <Button
              onClick={handleCreateAccount}
              disabled={createAccount.isPending}
              className="w-full"
            >
              {createAccount.isPending ? 'Criando...' : 'Criar Conta'}
            </Button>
          </CardContent>
        </Card>

        {/* Criar Meta */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Nome da meta"
              value={goalData.name}
              onChange={(e) => setGoalData(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="Valor alvo"
              value={goalData.targetAmount}
              onChange={(e) => setGoalData(prev => ({ ...prev, targetAmount: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="Data limite"
              value={goalData.deadline}
              onChange={(e) => setGoalData(prev => ({ ...prev, deadline: e.target.value }))}
            />
            <Button
              onClick={handleCreateGoal}
              disabled={createGoal.isPending}
              className="w-full"
            >
              {createGoal.isPending ? 'Criando...' : 'Criar Meta'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Exemplo de Transferência */}
      <Card>
        <CardHeader>
          <CardTitle>Transferência Entre Contas</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleTransfer}
            disabled={transferBetweenAccounts.isPending}
            variant="outline"
          >
            {transferBetweenAccounts.isPending ? 'Transferindo...' : 'Transferir R$ 100'}
          </Button>
        </CardContent>
      </Card>

      {/* Status das Mutações */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Operações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Transações:</strong>
              <div>Criar: {createTransaction.isPending ? '⏳' : '✅'}</div>
              <div>Atualizar: {updateTransaction.isPending ? '⏳' : '✅'}</div>
              <div>Deletar: {deleteTransaction.isPending ? '⏳' : '✅'}</div>
            </div>
            <div>
              <strong>Contas:</strong>
              <div>Criar: {createAccount.isPending ? '⏳' : '✅'}</div>
              <div>Atualizar: {updateAccount.isPending ? '⏳' : '✅'}</div>
              <div>Deletar: {deleteAccount.isPending ? '⏳' : '✅'}</div>
            </div>
            <div>
              <strong>Metas:</strong>
              <div>Criar: {createGoal.isPending ? '⏳' : '✅'}</div>
              <div>Atualizar: {updateGoal.isPending ? '⏳' : '✅'}</div>
              <div>Deletar: {deleteGoal.isPending ? '⏳' : '✅'}</div>
            </div>
            <div>
              <strong>Transferências:</strong>
              <div>Status: {transferBetweenAccounts.isPending ? '⏳' : '✅'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demonstração de Dados Atualizados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Atualizados Automaticamente</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando dados...</p>
          ) : (
            <div className="text-sm">
              <p>Os dados abaixo são atualizados automaticamente quando você cria/edita/deleta itens:</p>
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <pre>{JSON.stringify(cards, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}