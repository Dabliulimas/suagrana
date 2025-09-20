"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import type {
  Transaction,
  Goal,
  Investment,
  Account,
  Trip,
  Contact,
} from "../lib/storage";

interface SimpleFinancialState {
  transactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  accounts: Account[];
  trips: Trip[];
  contacts: Contact[];
  isLoading: boolean;
}

interface SimpleFinancialContextType {
  state: SimpleFinancialState;
  actions: {
    refreshAll: () => void;
  };
}

const SimpleFinancialContext = createContext<
  SimpleFinancialContextType | undefined
>(undefined);

export function SimpleFinancialProvider({ children }: { children: ReactNode }) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [state, setState] = useState<SimpleFinancialState>({
    transactions: [],
    goals: [],
    investments: [],
    accounts: [],
    trips: [],
    contacts: [],
    isLoading: false,
  });

  const actions = {
    refreshAll: () => {
      setState({
        transactions: transactions || [],
        goals: goals || [],
        investments: storage.getInvestments() || [],
        accounts: accounts || [],
        trips: storage.getTrips() || [],
        contacts: contacts || [],
        isLoading: false,
      });
    },
  };

  return (
    <SimpleFinancialContext.Provider value={{ state, actions }}>
      {children}
    </SimpleFinancialContext.Provider>
  );
}

export function useSimpleFinancialContext() {
  const context = useContext(SimpleFinancialContext);
  if (context === undefined) {
    throw new Error(
      "useSimpleFinancialContext must be used within a SimpleFinancialProvider",
    );
  }
  return context;
}
