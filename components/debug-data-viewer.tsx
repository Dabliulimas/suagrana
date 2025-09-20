"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useTransactions, useAccounts } from '../contexts/unified-context';

export function DebugDataViewer() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const { data: hookTransactions, isLoading: transactionsLoading } = useTransactions();
  const { data: hookAccounts, isLoading: accountsLoading } = useAccounts();

  const refreshLocalStorageData = () => {
    if (typeof window !== 'undefined') {
      const data = {
        transactions: localStorage.getItem('sua-grana-transactions'),
        accounts: localStorage.getItem('sua-grana-accounts'),
        goals: localStorage.getItem('sua-grana-goals'),
        investments: localStorage.getItem('sua-grana-investments'),
      };
      setLocalStorageData(data);
    }
  };

  useEffect(() => {
    refreshLocalStorageData();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Debug - Dados do Sistema
            <Button onClick={refreshLocalStorageData} size="sm">
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">LocalStorage:</h3>
            <div className="text-sm space-y-1">
              <p>Transações: {localStorageData.transactions ? `${JSON.parse(localStorageData.transactions).length} itens` : 'Vazio'}</p>
              <p>Contas: {localStorageData.accounts ? `${JSON.parse(localStorageData.accounts).length} itens` : 'Vazio'}</p>
              <p>Metas: {localStorageData.goals ? `${JSON.parse(localStorageData.goals).length} itens` : 'Vazio'}</p>
              <p>Investimentos: {localStorageData.investments ? `${JSON.parse(localStorageData.investments).length} itens` : 'Vazio'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Hooks:</h3>
            <div className="text-sm space-y-1">
              <p>Transações Hook: {transactionsLoading ? 'Carregando...' : `${hookTransactions.length} itens`}</p>
              <p>Contas Hook: {accountsLoading ? 'Carregando...' : `${hookAccounts.length} itens`}</p>
            </div>
          </div>

          {hookTransactions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Primeira transação:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(hookTransactions[0], null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
