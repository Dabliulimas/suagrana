"use client";

import { useTransactions, useAccounts, useGoals } from '@/contexts/unified-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSmartNotifications } from '@/lib/notifications/smart-notifications';

export default function TestDebugPage() {
  console.log('TestDebugPage: Component started rendering');
  
  try {
    console.log('TestDebugPage: About to call useTransactions');
    const { transactions, isLoading: transactionsLoading, error: transactionsError } = useTransactions();
    console.log('TestDebugPage: useTransactions result:', { transactionsCount: transactions?.length, transactionsLoading, transactionsError });
    
    console.log('TestDebugPage: About to call useAccounts');
    const { accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();
    console.log('TestDebugPage: useAccounts result:', { accountsCount: accounts?.length, accountsLoading, accountsError });
    
    console.log('TestDebugPage: About to call useGoals');
    const { goals, isLoading: goalsLoading, error: goalsError } = useGoals();
    console.log('TestDebugPage: useGoals result:', { goalsCount: goals?.length, goalsLoading, goalsError });
    
    console.log('TestDebugPage: About to call useSmartNotifications');
    const { notifications, isLoading: notificationsLoading } = useSmartNotifications();
    console.log('TestDebugPage: useSmartNotifications result:', { notificationsCount: notifications?.length, notificationsLoading });

    return (
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">Debug Page - Status dos Contextos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Loading: {transactionsLoading ? 'Sim' : 'Não'}</p>
                <p>Error: {transactionsError || 'Nenhum'}</p>
                <p>Count: {transactions?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Loading: {accountsLoading ? 'Sim' : 'Não'}</p>
                <p>Error: {accountsError || 'Nenhum'}</p>
                <p>Count: {accounts?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Loading: {goalsLoading ? 'Sim' : 'Não'}</p>
                <p>Error: {goalsError || 'Nenhum'}</p>
                <p>Count: {goals?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Loading: {notificationsLoading ? 'Sim' : 'Não'}</p>
                <p>Count: {notifications?.length || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de transações para debug */}
        <Card>
          <CardHeader>
            <CardTitle>Transações (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              {transactions?.slice(0, 5).map((transaction, index) => (
                <div key={index} className="text-sm p-2 border-b">
                  <p>ID: {transaction.id}</p>
                  <p>Tipo: {transaction.type}</p>
                  <p>Valor: R$ {transaction.amount}</p>
                  <p>Data: {transaction.date}</p>
                  <p>Categoria: {transaction.category}</p>
                </div>
              )) || <p>Nenhuma transação encontrada</p>}
            </div>
          </CardContent>
        </Card>

        {/* Notificações para debug */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {notifications?.slice(0, 3).map((notification, index) => (
                <div key={index} className="text-sm p-2 border rounded">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500">Tipo: {notification.type} | Prioridade: {notification.priority}</p>
                </div>
              )) || <p>Nenhuma notificação encontrada</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Erro Detectado!</h1>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">Erro: {error?.message || 'Erro desconhecido'}</p>
          <pre className="mt-2 text-xs text-red-600 overflow-auto">
            {error?.stack}
          </pre>
        </div>
      </div>
    );
  }
}
