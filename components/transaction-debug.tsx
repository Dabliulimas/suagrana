"use client";

import { useTransactions } from '../contexts/unified-context';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function TransactionDebug() {
  const { data: transactionData, isLoading } = useTransactions({
    page: 1,
    limit: 20,
  });

  const transactionsSimple = useTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>🔍 Debug Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Com Paginação:</h4>
            <p>Loading: {isLoading ? 'Sim' : 'Não'}</p>
            <p>Data structure: {JSON.stringify(Object.keys(transactionData || {}))}</p>
            <p>Transactions count: {transactionData?.data?.data?.length || 0}</p>
          </div>
          
          <div>
            <h4 className="font-semibold">Sem Paginação:</h4>
            <p>Loading: {transactionsSimple.isLoading ? 'Sim' : 'Não'}</p>
            <p>Data structure: {JSON.stringify(Object.keys(transactionsSimple.data || {}))}</p>
            <p>Transactions count: {transactionsSimple.data?.length || 0}</p>
          </div>

          <div>
            <h4 className="font-semibold">LocalStorage:</h4>
            <p>
              Transações no localStorage: {
                typeof window !== 'undefined' 
                  ? localStorage.getItem('sua-grana-transactions') 
                    ? JSON.parse(localStorage.getItem('sua-grana-transactions')!).length 
                    : 0 
                  : 'N/A'
              }
            </p>
          </div>

          {transactionData?.data?.data?.length > 0 && (
            <div>
              <h4 className="font-semibold">Primeira transação:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(transactionData.data.data[0], null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
