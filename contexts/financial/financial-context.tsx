"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { useAccounts, useTransactions, useGoals, useContacts } from "../contexts/unified-context";
import { logComponents } from "../../lib/logger";
import type {
  Transaction,
  Goal,
  Investment,
  Account,
  Trip,
  Contact,
} from "../lib/storage";
import { unifiedSystem } from "../lib/unified-financial-system";
import { toast } from "sonner";

interface FinancialState {
  transactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  accounts: Account[];
  trips: Trip[];
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  systemStatus: any | null;
  validationScore: number;
}

type FinancialAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | {
      type: "UPDATE_TRANSACTION";
      payload: { id: string; data: Partial<Transaction> };
    }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "SET_GOALS"; payload: Goal[] }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: { id: string; data: Partial<Goal> } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "SET_INVESTMENTS"; payload: Investment[] }
  | { type: "ADD_INVESTMENT"; payload: Investment }
  | {
      type: "UPDATE_INVESTMENT";
      payload: { id: string; data: Partial<Investment> };
    }
  | { type: "DELETE_INVESTMENT"; payload: string }
  | { type: "SET_ACCOUNTS"; payload: Account[] }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | { type: "UPDATE_ACCOUNT"; payload: { id: string; data: Partial<Account> } }
  | { type: "DELETE_ACCOUNT"; payload: string }
  | { type: "SET_TRIPS"; payload: Trip[] }
  | { type: "ADD_TRIP"; payload: Trip }
  | { type: "UPDATE_TRIP"; payload: { id: string; data: Partial<Trip> } }
  | { type: "DELETE_TRIP"; payload: string }
  | { type: "SET_CONTACTS"; payload: Contact[] }
  | { type: "ADD_CONTACT"; payload: Contact }
  | { type: "UPDATE_CONTACT"; payload: { id: string; data: Partial<Contact> } }
  | { type: "DELETE_CONTACT"; payload: string }
  | { type: "UPDATE_SYSTEM_STATUS"; payload: any }
  | { type: "SET_VALIDATION_SCORE"; payload: number }
  | { type: "REFRESH_ALL" };

const initialState: FinancialState = {
  transactions: [],
  goals: [],
  investments: [],
  accounts: [],
  trips: [],
  contacts: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
  systemStatus: null,
  validationScore: 100,
};

function financialReducer(
  state: FinancialState,
  action: FinancialAction,
): FinancialState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_TRANSACTIONS":
      return {
        ...state,
        transactions: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [...transactions, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.data } : t,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: transactions.filter((t) => t.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "SET_GOALS":
      return {
        ...state,
        goals: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_GOAL":
      return {
        ...state,
        goals: [...goals, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.data } : g,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_GOAL":
      return {
        ...state,
        goals: goals.filter((g) => g.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "SET_INVESTMENTS":
      return {
        ...state,
        investments: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_INVESTMENT":
      return {
        ...state,
        investments: [...investments, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_INVESTMENT":
      return {
        ...state,
        investments: investments.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.data } : i,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_INVESTMENT":
      return {
        ...state,
        investments: investments.filter((i) => i.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "SET_ACCOUNTS":
      return {
        ...state,
        accounts: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_ACCOUNT":
      return {
        ...state,
        accounts: [...accounts, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: accounts.map((a) =>
          a.id === action.payload.id ? { ...a, ...action.payload.data } : a,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_ACCOUNT":
      return {
        ...state,
        accounts: accounts.filter((a) => a.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "SET_TRIPS":
      return {
        ...state,
        trips: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_TRIP":
      return {
        ...state,
        trips: [...state.trips, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_TRIP":
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.data } : t,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_TRIP":
      return {
        ...state,
        trips: state.trips.filter((t) => t.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "SET_CONTACTS":
      return {
        ...state,
        contacts: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "ADD_CONTACT":
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c,
        ),
        lastUpdated: new Date().toISOString(),
      };

    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
        lastUpdated: new Date().toISOString(),
      };

    case "UPDATE_SYSTEM_STATUS":
      return {
        ...state,
        systemStatus: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "SET_VALIDATION_SCORE":
      return {
        ...state,
        validationScore: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case "REFRESH_ALL":
      return { ...state, isLoading: true, error: null };

    default:
      return state;
  }
}

interface FinancialContextType {
  state: FinancialState;
  dispatch: React.Dispatch<FinancialAction>;
  actions: {
    // Transactions
    addTransaction: (
      transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    ) => Promise<void>;
    updateTransaction: (
      id: string,
      data: Partial<Transaction>,
    ) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    // Goals
    addGoal: (
      goal: Omit<Goal, "id" | "createdAt" | "updatedAt">,
    ) => Promise<void>;
    updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;

    // Investments
    addInvestment: (
      investment: Omit<Investment, "id" | "createdAt" | "updatedAt">,
    ) => Promise<void>;
    updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;

    // Accounts
    addAccount: (account: Omit<Account, "id">) => Promise<void>;
    updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;

    // Trips
    addTrip: (trip: Omit<Trip, "id">) => Promise<void>;
    updateTrip: (id: string, data: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;

    // Contacts
    addContact: (contact: Omit<Contact, "id" | "createdAt">) => Promise<void>;
    updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;

    // General
    refreshAll: () => Promise<void>;
  };
}

const FinancialContext = createContext<FinancialContextType | undefined>(
  undefined,
);

export function FinancialProvider({ children }: { children: ReactNode }) {
  // const { accounts, create: createAccount, update: updateAccount, delete: deleteAccount } = useAccounts();
  // const { transactions, create: createTransaction, update: updateTransaction, delete: deleteTransaction } = useTransactions();
  const [state, dispatch] = useReducer(financialReducer, initialState);

  // Load initial data and initialize unified system
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        console.log("🚀 Carregando dados financeiros...");

        // Carregar dados via sistema unificado (com fallback automático)
        const [transactions, goals, investments, accounts] =
          await Promise.allSettled([
            unifiedSystem.getTransactions(),
            unifiedSystem.getGoals(),
            unifiedSystem.getInvestments(),
            unifiedSystem.getAccounts(),
          ]);

        // Carregar dados locais (trips e contacts)
        const [trips, contacts] = await Promise.allSettled([
          Promise.resolve(storage.getTrips() || []),
          Promise.resolve(contacts || []),
        ]);

        // Processar resultados
        const transactionsData =
          transactions.status === "fulfilled" ? transactions.value : [];
        const goalsData = goals.status === "fulfilled" ? goals.value : [];
        const investmentsData =
          investments.status === "fulfilled" ? investments.value : [];
        const accountsData =
          accounts.status === "fulfilled" ? accounts.value : [];
        const tripsData = trips.status === "fulfilled" ? trips.value : [];
        const contactsData =
          contacts.status === "fulfilled" ? contacts.value : [];

        console.log("🔍 FinancialProvider - Dados carregados:", {
          transactions: transactionsData.length,
          goals: goalsData.length,
          investments: investmentsData.length,
          accounts: accountsData.length,
          trips: tripsData.length,
          contacts: contactsData.length,
        });

        dispatch({ type: "SET_TRANSACTIONS", payload: transactionsData });
        dispatch({ type: "SET_GOALS", payload: goalsData });
        dispatch({ type: "SET_INVESTMENTS", payload: investmentsData });
        dispatch({ type: "SET_ACCOUNTS", payload: accountsData });
        dispatch({ type: "SET_TRIPS", payload: tripsData });
        dispatch({ type: "SET_CONTACTS", payload: contactsData });
        dispatch({ type: "SET_VALIDATION_SCORE", payload: 100 });
        dispatch({ type: "SET_LOADING", payload: false });

        console.log("✅ Sistema financeiro inicializado com sucesso");
      } catch (error) {
        logComponents.error("❌ Erro ao carregar dados financeiros:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Erro ao carregar dados financeiros",
        });
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    loadData();
  }, []);

  // Action creators
  const actions = {
    // Transactions
    addTransaction: async (
      transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
    ) => {
      try {
        // Usar sistema unificado que conecta ao backend
        const transaction =
          await unifiedSystem.createTransaction(transactionData);
        dispatch({ type: "ADD_TRANSACTION", payload: transaction });

        // Não mostrar toast aqui pois o unifiedSystem já mostra
      } catch (error) {
        logComponents.error("Error adding transaction:", error);
        toast.error("Não foi possível adicionar a transação.");
        throw error;
      }
    },

    updateTransaction: async (id: string, data: Partial<Transaction>) => {
      try {
        await updateTransaction(id, data);
        dispatch({ type: "UPDATE_TRANSACTION", payload: { id, data } });
        toast.success("Transação atualizada com sucesso");
      } catch (error) {
        logComponents.error("Error updating transaction:", error);
        toast.error("Não foi possível atualizar a transação.");
        throw error;
      }
    },

    deleteTransaction: async (id: string) => {
      try {
        await deleteTransaction(id);
        dispatch({ type: "DELETE_TRANSACTION", payload: id });
        toast.success("Transação removida com sucesso");
      } catch (error) {
        logComponents.error("Error deleting transaction:", error);

        // Revert optimistic update on error
        dispatch({ type: "REFRESH_ALL" });

        toast.error("Não foi possível remover a transação.");
        throw error;
      }
    },

    // Goals
    addGoal: async (goalData: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
      try {
        const goal = storage.saveGoal(goalData);
        dispatch({ type: "ADD_GOAL", payload: goal });
      } catch (error) {
        logComponents.error("Error adding goal:", error);
        throw error;
      }
    },

    updateGoal: async (id: string, data: Partial<Goal>) => {
      try {
        storage.updateGoal(id, data);
        dispatch({ type: "UPDATE_GOAL", payload: { id, data } });
      } catch (error) {
        logComponents.error("Error updating goal:", error);
        throw error;
      }
    },

    deleteGoal: async (id: string) => {
      try {
        storage.deleteGoal(id);
        dispatch({ type: "DELETE_GOAL", payload: id });
      } catch (error) {
        logComponents.error("Error deleting goal:", error);
        throw error;
      }
    },

    // Investments
    addInvestment: async (
      investmentData: Omit<Investment, "id" | "createdAt" | "updatedAt">,
    ) => {
      try {
        const investment = storage.saveInvestment(investmentData);
        dispatch({ type: "ADD_INVESTMENT", payload: investment });
      } catch (error) {
        logComponents.error("Error adding investment:", error);
        throw error;
      }
    },

    updateInvestment: async (id: string, data: Partial<Investment>) => {
      try {
        storage.updateInvestment(id, data);
        dispatch({ type: "UPDATE_INVESTMENT", payload: { id, data } });
      } catch (error) {
        logComponents.error("Error updating investment:", error);
        throw error;
      }
    },

    deleteInvestment: async (id: string) => {
      try {
        storage.deleteInvestment(id);
        dispatch({ type: "DELETE_INVESTMENT", payload: id });
      } catch (error) {
        logComponents.error("Error deleting investment:", error);
        throw error;
      }
    },

    // Accounts
    addAccount: async (accountData: Omit<Account, "id">) => {
      try {
        const account = storage.saveAccount(accountData);
        dispatch({ type: "ADD_ACCOUNT", payload: account });
      } catch (error) {
        logComponents.error("Error adding account:", error);
        throw error;
      }
    },

    updateAccount: async (id: string, data: Partial<Account>) => {
      try {
        await updateAccount(id, data);
        dispatch({ type: "UPDATE_ACCOUNT", payload: { id, data } });
      } catch (error) {
        logComponents.error("Error updating account:", error);
        throw error;
      }
    },

    deleteAccount: async (id: string) => {
      try {
        await deleteAccount(id);
        dispatch({ type: "DELETE_ACCOUNT", payload: id });
      } catch (error) {
        logComponents.error("Error deleting account:", error);
        throw error;
      }
    },

    // Trips
    addTrip: async (tripData: Omit<Trip, "id">) => {
      try {
        const trip = storage.saveTrip(tripData);
        dispatch({ type: "ADD_TRIP", payload: trip });
      } catch (error) {
        logComponents.error("Error adding trip:", error);
        throw error;
      }
    },

    updateTrip: async (id: string, data: Partial<Trip>) => {
      try {
        storage.updateTrip(id, data);
        dispatch({ type: "UPDATE_TRIP", payload: { id, data } });
      } catch (error) {
        logComponents.error("Error updating trip:", error);
        throw error;
      }
    },

    deleteTrip: async (id: string) => {
      try {
        storage.deleteTrip(id);
        dispatch({ type: "DELETE_TRIP", payload: id });
      } catch (error) {
        logComponents.error("Error deleting trip:", error);
        throw error;
      }
    },

    // Contacts
    addContact: async (contactData: Omit<Contact, "id" | "createdAt">) => {
      try {
        const contact = storage.saveContact(contactData);
        dispatch({ type: "ADD_CONTACT", payload: contact });
      } catch (error) {
        logComponents.error("Error adding contact:", error);
        throw error;
      }
    },

    updateContact: async (id: string, data: Partial<Contact>) => {
      try {
        storage.updateContact(id, data);
        dispatch({ type: "UPDATE_CONTACT", payload: { id, data } });
      } catch (error) {
        logComponents.error("Error updating contact:", error);
        throw error;
      }
    },

    deleteContact: async (id: string) => {
      try {
        storage.deleteContact(id);
        dispatch({ type: "DELETE_CONTACT", payload: id });
      } catch (error) {
        logComponents.error("Error deleting contact:", error);
        throw error;
      }
    },

    // General
    refreshAll: async () => {
      dispatch({ type: "REFRESH_ALL" });
      // Reload data
      try {
        const [transactions, goals, investments, accounts, trips, contacts] =
          await Promise.all([
            Promise.resolve(transactions || []),
            Promise.resolve(goals || []),
            Promise.resolve(storage.getInvestments() || []),
            Promise.resolve(accounts || []),
            Promise.resolve(storage.getTrips() || []),
            Promise.resolve(contacts || []),
          ]);

        dispatch({ type: "SET_TRANSACTIONS", payload: transactions });
        dispatch({ type: "SET_GOALS", payload: goals });
        dispatch({ type: "SET_INVESTMENTS", payload: investments });
        dispatch({ type: "SET_ACCOUNTS", payload: accounts });
        dispatch({ type: "SET_TRIPS", payload: trips });
        dispatch({ type: "SET_CONTACTS", payload: contacts });
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        logComponents.error("Error refreshing data:", error);
        dispatch({ type: "SET_ERROR", payload: "Erro ao atualizar dados" });
      }
    },
  };

  return (
    <FinancialContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </FinancialContext.Provider>
  );
}

// useUnified removido - use hooks específicos do unified-context
