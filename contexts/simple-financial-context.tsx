"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  simpleStorage,
  SimpleTransaction,
  SimpleAccount,
  SimpleGoal,
  SimpleContact,
} from "../lib/simple-storage";
import { toast } from "sonner";

import { logComponents } from "../../lib/logger";
interface SimpleFinancialState {
  transactions: SimpleTransaction[];
  accounts: SimpleAccount[];
  goals: SimpleGoal[];
  contacts: SimpleContact[];
  isLoading: boolean;
}

interface SimpleFinancialContextType {
  state: SimpleFinancialState;
  actions: {
    // Transactions
    addTransaction: (
      transaction: Omit<SimpleTransaction, "id" | "createdAt">,
    ) => void;
    deleteTransaction: (id: string) => void;

    // Accounts
    addAccount: (account: Omit<SimpleAccount, "id" | "createdAt">) => void;

    // Goals
    addGoal: (goal: Omit<SimpleGoal, "id" | "createdAt">) => void;
    updateGoal: (id: string, updates: Partial<SimpleGoal>) => void;

    // Contacts
    addContact: (contact: Omit<SimpleContact, "id" | "createdAt">) => void;
    updateContact: (id: string, updates: Partial<SimpleContact>) => void;
    deleteContact: (id: string) => void;

    // Utils
    refreshData: () => void;
    populateTestData: () => void;
    clearAllData: () => void;
  };
}

const SimpleFinancialContext = createContext<
  SimpleFinancialContextType | undefined
>(undefined);

export function SimpleFinancialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimpleFinancialState>({
    transactions: [],
    accounts: [],
    goals: [],
    contacts: [],
    isLoading: true,
  });

  const loadData = () => {
    try {
      const transactions = simpleStorage.getTransactions();
      const accounts = simpleStorage.getAccounts();
      const goals = simpleStorage.getGoals();
      const contacts = simpleStorage.getContacts();

      setState({
        transactions,
        accounts,
        goals,
        contacts,
        isLoading: false,
      });

      console.log("✅ Dados carregados:", {
        transactions: transactions.length,
        accounts: accounts.length,
        goals: goals.length,
        contacts: contacts.length,
      });
    } catch (error) {
      logComponents.error("❌ Erro ao carregar dados:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const actions = {
    addTransaction: (
      transactionData: Omit<SimpleTransaction, "id" | "createdAt">,
    ) => {
      try {
        const newTransaction = simpleStorage.saveTransaction(transactionData);
        setState((prev) => ({
          ...prev,
          transactions: [...prev.transactions, newTransaction],
          accounts: simpleStorage.getAccounts(), // Atualizar contas com novos saldos
        }));
        toast.success("Transação adicionada com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao adicionar transação:", error);
        toast.error("Erro ao adicionar transação");
      }
    },

    deleteTransaction: (id: string) => {
      try {
        simpleStorage.deleteTransaction(id);
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
          accounts: simpleStorage.getAccounts(), // Atualizar contas com saldos revertidos
        }));
        toast.success("Transação removida com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao remover transação:", error);
        toast.error("Erro ao remover transação");
      }
    },

    addAccount: (accountData: Omit<SimpleAccount, "id" | "createdAt">) => {
      try {
        const newAccount = simpleStorage.saveAccount(accountData);
        setState((prev) => ({
          ...prev,
          accounts: [...prev.accounts, newAccount],
        }));
        toast.success("Conta adicionada com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao adicionar conta:", error);
        toast.error("Erro ao adicionar conta");
      }
    },

    addGoal: (goalData: Omit<SimpleGoal, "id" | "createdAt">) => {
      try {
        const newGoal = simpleStorage.saveGoal(goalData);
        setState((prev) => ({
          ...prev,
          goals: [...prev.goals, newGoal],
        }));
        toast.success("Meta adicionada com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao adicionar meta:", error);
        toast.error("Erro ao adicionar meta");
      }
    },

    updateGoal: (id: string, updates: Partial<SimpleGoal>) => {
      try {
        simpleStorage.updateGoal(id, updates);
        setState((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g,
          ),
        }));
        toast.success("Meta atualizada com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao atualizar meta:", error);
        toast.error("Erro ao atualizar meta");
      }
    },

    refreshData: () => {
      loadData();
    },

    populateTestData: () => {
      simpleStorage.populateTestData();
      loadData();
      toast.success("Dados de teste criados!");
    },

    addContact: (contactData: Omit<SimpleContact, "id" | "createdAt">) => {
      try {
        const newContact = simpleStorage.saveContact(contactData);
        setState((prev) => ({
          ...prev,
          contacts: [...prev.contacts, newContact],
        }));
        toast.success("Contato adicionado com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao adicionar contato:", error);
        toast.error("Erro ao adicionar contato");
      }
    },

    updateContact: (id: string, updates: Partial<SimpleContact>) => {
      try {
        simpleStorage.updateContact(id, updates);
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.map((c) =>
            c.id === id ? { ...c, ...updates } : c,
          ),
        }));
        toast.success("Contato atualizado com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao atualizar contato:", error);
        toast.error("Erro ao atualizar contato");
      }
    },

    deleteContact: (id: string) => {
      try {
        simpleStorage.deleteContact(id);
        setState((prev) => ({
          ...prev,
          contacts: prev.contacts.filter((c) => c.id !== id),
        }));
        toast.success("Contato removido com sucesso!");
      } catch (error) {
        logComponents.error("Erro ao remover contato:", error);
        toast.error("Erro ao remover contato");
      }
    },

    clearAllData: () => {
      simpleStorage.clearAllData();
      setState({
        transactions: [],
        accounts: [],
        goals: [],
        contacts: [],
        isLoading: false,
      });
      toast.success("Todos os dados foram limpos!");
    },
  };

  return (
    <SimpleFinancialContext.Provider value={{ state, actions }}>
      {children}
    </SimpleFinancialContext.Provider>
  );
}

export function useSimpleFinancial() {
  const context = useContext(SimpleFinancialContext);
  if (context === undefined) {
    throw new Error(
      "useSimpleFinancial must be used within a SimpleFinancialProvider",
    );
  }
  return context;
}
