"use client";

import React from "react";
import { useTransactions, useAccounts, useGoals } from '@/contexts/unified-context';

export default function TestContextPage() {
  console.log('TestContextPage: Starting render');
  
  try {
    console.log('TestContextPage: About to call hooks');
    
    const transactionsResult = useTransactions();
    console.log('TestContextPage: useTransactions result:', transactionsResult);
    
    const accountsResult = useAccounts();
    console.log('TestContextPage: useAccounts result:', accountsResult);
    
    const goalsResult = useGoals();
    console.log('TestContextPage: useGoals result:', goalsResult);
    
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Test Context Page</h1>
        <div className="mt-4 space-y-4">
          <div>
            <h2 className="font-semibold">Transactions:</h2>
            <p>Count: {transactionsResult.transactions?.length || 0}</p>
            <p>Loading: {transactionsResult.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {transactionsResult.error || 'None'}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Accounts:</h2>
            <p>Count: {accountsResult.accounts?.length || 0}</p>
            <p>Loading: {accountsResult.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {accountsResult.error || 'None'}</p>
          </div>
          
          <div>
            <h2 className="font-semibold">Goals:</h2>
            <p>Count: {goalsResult.goals?.length || 0}</p>
            <p>Loading: {goalsResult.isLoading ? 'Yes' : 'No'}</p>
            <p>Error: {goalsResult.error || 'None'}</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('TestContextPage: Error during render:', error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Error in Test Context Page</h1>
        <pre className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-xs">
          {error instanceof Error ? error.stack : JSON.stringify(error)}
        </pre>
      </div>
    );
  }
}
