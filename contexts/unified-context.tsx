"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { getDataLayer } from "../lib/data-layer/data-layer";
import type {
  Transaction,
  Account,
  Goal,
  Contact,
  Trip,
  Investment,
  SharedDebt,
  ResourceType,
  SyncStatus,
} from "../lib/data-layer/types";
import { toast } from "sonner";
import { logUnifiedContext } from "../lib/utils/logger";

// Unified State Interface
interface UnifiedState {
  // Data
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  contacts: Contact[];
  trips: Trip[];
  investments: Investment[];
  sharedDebts: SharedDebt[];

  // UI State
  isLoading: boolean;
  isOnline: boolean;
  pendingOperations: number;
  lastSync: Date | null;

  // Error State
  errors: Record<string, string>;

  // Loading States per Resource
  loadingStates: Record<ResourceType, boolean>;
}

// Action Types
type UnifiedAction =
  | { type: "SET_LOADING"; payload: boolean }
  | {
      type: "SET_RESOURCE_LOADING";
      payload: { resource: ResourceType; loading: boolean };
    }
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "SET_SYNC_STATUS"; payload: SyncStatus }
  | { type: "SET_ERROR"; payload: { resource: string; error: string } }
  | { type: "CLEAR_ERROR"; payload: string }
  | { type: "SET_TRANSACTIONS"; payload: Transaction[] }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "REMOVE_TRANSACTION"; payload: string }
  | { type: "SET_ACCOUNTS"; payload: Account[] }
  | { type: "ADD_ACCOUNT"; payload: Account }
  | { type: "UPDATE_ACCOUNT"; payload: Account }
  | { type: "REMOVE_ACCOUNT"; payload: string }
  | { type: "SET_GOALS"; payload: Goal[] }
  | { type: "ADD_GOAL"; payload: Goal }
  | { type: "UPDATE_GOAL"; payload: Goal }
  | { type: "REMOVE_GOAL"; payload: string }
  | { type: "SET_CONTACTS"; payload: Contact[] }
  | { type: "ADD_CONTACT"; payload: Contact }
  | { type: "UPDATE_CONTACT"; payload: Contact }
  | { type: "REMOVE_CONTACT"; payload: string }
  | { type: "SET_TRIPS"; payload: Trip[] }
  | { type: "ADD_TRIP"; payload: Trip }
  | { type: "UPDATE_TRIP"; payload: Trip }
  | { type: "REMOVE_TRIP"; payload: string }
  | { type: "SET_INVESTMENTS"; payload: Investment[] }
  | { type: "ADD_INVESTMENT"; payload: Investment }
  | { type: "UPDATE_INVESTMENT"; payload: Investment }
  | { type: "REMOVE_INVESTMENT"; payload: string }
  | { type: "SET_SHARED_DEBTS"; payload: SharedDebt[] }
  | { type: "ADD_SHARED_DEBT"; payload: SharedDebt }
  | { type: "UPDATE_SHARED_DEBT"; payload: SharedDebt }
  | { type: "REMOVE_SHARED_DEBT"; payload: string };

// Initial State
const initialState: UnifiedState = {
  transactions: [],
  accounts: [],
  goals: [],
  contacts: [],
  trips: [],
  investments: [],
  sharedDebts: [],
  isLoading: true,
  isOnline:
    typeof window !== "undefined" && window
      ? (navigator?.onLine ?? true)
      : true,
  pendingOperations: 0,
  lastSync: null,
  errors: {},
  loadingStates: {
    transactions: false,
    accounts: false,
    goals: false,
    contacts: false,
    trips: false,
    investments: false,
    "shared-debts": false,
  },
};

// Reducer
function unifiedReducer(
  state: UnifiedState,
  action: UnifiedAction,
): UnifiedState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_RESOURCE_LOADING":
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.payload.resource]: action.payload.loading,
        },
      };

    case "SET_ONLINE_STATUS":
      return { ...state, isOnline: action.payload };

    case "SET_SYNC_STATUS":
      return {
        ...state,
        isOnline: action.payload.isOnline,
        pendingOperations: action.payload.pendingOperations,
        lastSync: action.payload.lastSync
          ? new Date(action.payload.lastSync)
          : null,
      };

    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.resource]: action.payload.error,
        },
      };

    case "CLEAR_ERROR":
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };

    // Transactions
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.payload };
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case "REMOVE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };

    // Accounts
    case "SET_ACCOUNTS":
      return { ...state, accounts: action.payload };
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.payload] };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
      };
    case "REMOVE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };

    // Goals
    case "SET_GOALS":
      return { ...state, goals: action.payload };
    case "ADD_GOAL":
      return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g,
        ),
      };
    case "REMOVE_GOAL":
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };

    // Contacts
    case "SET_CONTACTS":
      return { ...state, contacts: action.payload };
    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, action.payload] };
    case "UPDATE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case "REMOVE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
      };

    // Trips
    case "SET_TRIPS":
      return { ...state, trips: action.payload };
    case "ADD_TRIP":
      return { ...state, trips: [...state.trips, action.payload] };
    case "UPDATE_TRIP":
      return {
        ...state,
        trips: state.trips.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        ),
      };
    case "REMOVE_TRIP":
      return {
        ...state,
        trips: state.trips.filter((t) => t.id !== action.payload),
      };

    // Investments
    case "SET_INVESTMENTS":
      return { ...state, investments: action.payload };
    case "ADD_INVESTMENT":
      return { ...state, investments: [...state.investments, action.payload] };
    case "UPDATE_INVESTMENT":
      return {
        ...state,
        investments: state.investments.map((i) =>
          i.id === action.payload.id ? action.payload : i,
        ),
      };
    case "REMOVE_INVESTMENT":
      return {
        ...state,
        investments: state.investments.filter((i) => i.id !== action.payload),
      };

    // Shared Debts
    case "SET_SHARED_DEBTS":
      return { ...state, sharedDebts: action.payload };
    case "ADD_SHARED_DEBT":
      return { ...state, sharedDebts: [...state.sharedDebts, action.payload] };
    case "UPDATE_SHARED_DEBT":
      return {
        ...state,
        sharedDebts: state.sharedDebts.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
      };
    case "REMOVE_SHARED_DEBT":
      return {
        ...state,
        sharedDebts: state.sharedDebts.filter((d) => d.id !== action.payload),
      };

    default:
      return state;
  }
}

// Context Actions Interface
interface UnifiedContextActions {
  // Generic CRUD
  create: <T extends ResourceType>(resource: T, data: any) => Promise<any>;
  read: <T extends ResourceType>(
    resource: T,
    id?: string,
    params?: any,
  ) => Promise<any>;
  update: <T extends ResourceType>(
    resource: T,
    id: string,
    data: any,
  ) => Promise<any>;
  delete: (resource: ResourceType, id: string) => Promise<void>;

  // Sync Operations
  sync: () => Promise<void>;
  forceSyncAll: () => Promise<void>;

  // Error Handling
  clearError: (resource: string) => void;

  // Data Loading
  loadAllData: () => Promise<void>;
  refreshData: (resource?: ResourceType) => Promise<void>;

  // Cache Management
  invalidateCache: (resource: ResourceType, id?: string) => void;
}

// Context Type
interface UnifiedContextType {
  state: UnifiedState;
  actions: UnifiedContextActions;
}

// Create Context
const UnifiedContext = createContext<UnifiedContextType | undefined>(undefined);

// Provider Component
export function UnifiedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);
  const dataLayer = getDataLayer();

  // Setup sync status monitoring
  useEffect(() => {
    const updateSyncStatus = () => {
      const syncStatus = dataLayer.getSyncStatus();
      dispatch({ type: "SET_SYNC_STATUS", payload: syncStatus });
    };

    // Initial sync status
    updateSyncStatus();

    // Listen for sync completion
    dataLayer.onSyncComplete(updateSyncStatus);

    // Monitor online status
    const handleOnline = () =>
      dispatch({ type: "SET_ONLINE_STATUS", payload: true });
    const handleOffline = () =>
      dispatch({ type: "SET_ONLINE_STATUS", payload: false });

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }, [dataLayer]);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Helper function to handle errors
  const handleError = (resource: string, error: any) => {
    // Detectar erros de conectividade
    const isConnectivityError = error?.message?.includes('Conectividade indisponível') ||
                               error?.message?.includes('Network connection failed') ||
                               error?.message?.includes('Failed to fetch') ||
                               error?.type === 'network_error';
    
    // Detectar erros de autenticação
    const isAuthError = error?.status === 401 || error?.response?.status === 401;
    
    // Log apenas erros significativos
    if (!isConnectivityError && !isAuthError) {
      logUnifiedContext.warn(`Erro em ${resource}`, { 
        message: error?.message || 'Erro desconhecido',
        status: error?.status || error?.response?.status
      });
    }
    
    let errorMessage = "Erro desconhecido";
    let toastType: 'error' | 'warning' | 'info' = 'error';
    
    // Tratar diferentes tipos de erro
    if (isConnectivityError) {
      errorMessage = "Sem conexão. Dados salvos localmente.";
      toastType = 'info';
    } else if (error?.status === 401 || error?.response?.status === 401) {
      errorMessage = "Autenticação requerida";
      toastType = 'warning';
    } else if (error?.status === 403 || error?.response?.status === 403) {
      errorMessage = "Acesso negado";
    } else if (error?.status === 404 || error?.response?.status === 404) {
      errorMessage = "Não encontrado";
    } else if (error?.status === 500 || error?.response?.status === 500) {
      errorMessage = "Erro do servidor";
    } else if (error && typeof error === 'object') {
      if (error.message && typeof error.message === 'string') {
        // Para mensagens do DataLayer, usar diretamente
        errorMessage = error.message;
        // Se menciona dados salvos localmente, é info
        if (errorMessage.includes('salvos localmente')) {
          toastType = 'info';
        }
      } else if (error.error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.details && typeof error.details === 'string') {
        errorMessage = error.details;
      } else {
        errorMessage = `Erro ao processar ${resource}`;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    dispatch({ type: "SET_ERROR", payload: { resource, error: errorMessage } });
    
    // Mostrar toast baseado no tipo de erro
    switch(toastType) {
      case 'info':
        toast.info(errorMessage);
        break;
      case 'warning':
        toast.warning(errorMessage);
        break;
      case 'error':
      default:
        // Para erros reais, mostrar apenas se não for spam
        if (!isConnectivityError && !isAuthError) {
          toast.error(errorMessage);
        }
        break;
    }
  };

  // Generic CRUD operations
  const create = async <T extends ResourceType>(
    resource: T,
    data: any,
  ): Promise<any> => {
    try {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: resource });

      const result = await dataLayer.create(resource, data);

      // Update state based on resource type
      switch (resource) {
        case "transactions":
          dispatch({ type: "ADD_TRANSACTION", payload: result as Transaction });
          break;
        case "accounts":
          dispatch({ type: "ADD_ACCOUNT", payload: result as Account });
          break;
        case "goals":
          dispatch({ type: "ADD_GOAL", payload: result as Goal });
          break;
        case "contacts":
          dispatch({ type: "ADD_CONTACT", payload: result as Contact });
          break;
        case "trips":
          dispatch({ type: "ADD_TRIP", payload: result as Trip });
          break;
        case "investments":
          dispatch({ type: "ADD_INVESTMENT", payload: result as Investment });
          break;
        case "shared-debts":
          dispatch({ type: "ADD_SHARED_DEBT", payload: result as SharedDebt });
          break;
      }

      // Mensagem de sucesso baseada no contexto
      if (result?._offline) {
        toast.success(`${resource} salvo localmente (sem conexão)`);
      } else {
        toast.success(`${resource} criado com sucesso`);
      }
      return result;
    } catch (error) {
      handleError(resource, error);
      throw error;
    } finally {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: false },
      });
    }
  };

  const read = async <T extends ResourceType>(
    resource: T,
    id?: string,
    params?: any,
  ): Promise<any> => {
    try {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: resource });

      const result = await dataLayer.read(resource, id, params);
      return result;
    } catch (error) {
      handleError(resource, error);
      throw error;
    } finally {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: false },
      });
    }
  };

  const update = async <T extends ResourceType>(
    resource: T,
    id: string,
    data: any,
  ): Promise<any> => {
    try {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: resource });

      logUnifiedContext.info(`Atualizando ${resource}:`, { id, data });
      
      const result = await dataLayer.update(resource, id, data);

      // Update state based on resource type
      switch (resource) {
        case "transactions":
          dispatch({
            type: "UPDATE_TRANSACTION",
            payload: result as Transaction,
          });
          break;
        case "accounts":
          dispatch({ type: "UPDATE_ACCOUNT", payload: result as Account });
          break;
        case "goals":
          dispatch({ type: "UPDATE_GOAL", payload: result as Goal });
          break;
        case "contacts":
          dispatch({ type: "UPDATE_CONTACT", payload: result as Contact });
          break;
        case "trips":
          dispatch({ type: "UPDATE_TRIP", payload: result as Trip });
          break;
        case "investments":
          dispatch({
            type: "UPDATE_INVESTMENT",
            payload: result as Investment,
          });
          break;
        case "shared-debts":
          dispatch({
            type: "UPDATE_SHARED_DEBT",
            payload: result as SharedDebt,
          });
          break;
      }

      // Don't show success toast for transactions as the component handles it
      if (resource !== "transactions") {
        toast.success(`${resource} updated successfully`);
      }
      return result;
    } catch (error) {
      logUnifiedContext.error(`Erro ao atualizar ${resource}:`, {
        id,
        data,
        error: error?.message || error,
        status: error?.status || error?.response?.status
      });
      handleError(resource, error);
      throw error;
    } finally {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: false },
      });
    }
  };

  const deleteResource = async (
    resource: ResourceType,
    id: string,
  ): Promise<void> => {
    try {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: true },
      });
      dispatch({ type: "CLEAR_ERROR", payload: resource });

      await dataLayer.delete(resource, id);

      // Update state based on resource type
      switch (resource) {
        case "transactions":
          dispatch({ type: "REMOVE_TRANSACTION", payload: id });
          break;
        case "accounts":
          dispatch({ type: "REMOVE_ACCOUNT", payload: id });
          break;
        case "goals":
          dispatch({ type: "REMOVE_GOAL", payload: id });
          break;
        case "contacts":
          dispatch({ type: "REMOVE_CONTACT", payload: id });
          break;
        case "trips":
          dispatch({ type: "REMOVE_TRIP", payload: id });
          break;
        case "investments":
          dispatch({ type: "REMOVE_INVESTMENT", payload: id });
          break;
        case "shared-debts":
          dispatch({ type: "REMOVE_SHARED_DEBT", payload: id });
          break;
      }

      toast.success(`${resource} deleted successfully`);
    } catch (error) {
      handleError(resource, error);
      throw error;
    } finally {
      dispatch({
        type: "SET_RESOURCE_LOADING",
        payload: { resource, loading: false },
      });
    }
  };

  // Load all data
  const loadAllData = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });

      const [
        transactions,
        accounts,
        goals,
        contacts,
        trips,
        investments,
        sharedDebts,
      ] = await Promise.allSettled([
        dataLayer.read("transactions"),
        dataLayer.read("accounts"),
        dataLayer.read("goals"),
        dataLayer.read("contacts"),
        dataLayer.read("trips"),
        dataLayer.read("investments"),
        dataLayer.read("shared-debts"),
      ]);

      // Handle transactions
      if (transactions.status === "fulfilled") {
        dispatch({
          type: "SET_TRANSACTIONS",
          payload: transactions.value as Transaction[],
        });
      } else {
        handleError("transactions", transactions.reason);
      }

      // Handle accounts
      if (accounts.status === "fulfilled") {
        dispatch({
          type: "SET_ACCOUNTS",
          payload: accounts.value as Account[],
        });
      } else {
        handleError("accounts", accounts.reason);
      }

      // Handle goals
      if (goals.status === "fulfilled") {
        dispatch({ type: "SET_GOALS", payload: goals.value as Goal[] });
      } else {
        handleError("goals", goals.reason);
      }

      // Handle contacts
      if (contacts.status === "fulfilled") {
        dispatch({
          type: "SET_CONTACTS",
          payload: contacts.value as Contact[],
        });
      } else {
        handleError("contacts", contacts.reason);
      }

      // Handle trips
      if (trips.status === "fulfilled") {
        dispatch({ type: "SET_TRIPS", payload: trips.value as Trip[] });
      } else {
        handleError("trips", trips.reason);
      }

      // Handle investments
      if (investments.status === "fulfilled") {
        dispatch({
          type: "SET_INVESTMENTS",
          payload: investments.value as Investment[],
        });
      } else {
        handleError("investments", investments.reason);
      }

      // Handle shared debts
      if (sharedDebts.status === "fulfilled") {
        dispatch({
          type: "SET_SHARED_DEBTS",
          payload: sharedDebts.value as SharedDebt[],
        });
      } else {
        handleError("shared-debts", sharedDebts.reason);
      }
    } catch (error) {
      logUnifiedContext.error("Falha ao carregar dados", error);
      handleError("loadAllData", error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Refresh specific resource data
  const refreshData = async (resource?: ResourceType): Promise<void> => {
    if (resource) {
      try {
        const data = await dataLayer.read(resource);

        switch (resource) {
          case "transactions":
            dispatch({
              type: "SET_TRANSACTIONS",
              payload: data as Transaction[],
            });
            break;
          case "accounts":
            dispatch({ type: "SET_ACCOUNTS", payload: data as Account[] });
            break;
          case "goals":
            dispatch({ type: "SET_GOALS", payload: data as Goal[] });
            break;
          case "contacts":
            dispatch({ type: "SET_CONTACTS", payload: data as Contact[] });
            break;
          case "trips":
            dispatch({ type: "SET_TRIPS", payload: data as Trip[] });
            break;
          case "investments":
            dispatch({
              type: "SET_INVESTMENTS",
              payload: data as Investment[],
            });
            break;
          case "shared-debts":
            dispatch({
              type: "SET_SHARED_DEBTS",
              payload: data as SharedDebt[],
            });
            break;
        }
      } catch (error) {
        handleError(resource, error);
      }
    } else {
      await loadAllData();
    }
  };

  // Sync operations
  const sync = async (): Promise<void> => {
    try {
      await dataLayer.syncPendingOperations();
      toast.success("Data synchronized successfully");
    } catch (error) {
      toast.error("Failed to synchronize data");
      throw error;
    }
  };

  const forceSyncAll = async (): Promise<void> => {
    try {
      await dataLayer.forceSyncAll();
      await loadAllData(); // Reload all data after sync
      toast.success("Full synchronization completed");
    } catch (error) {
      toast.error("Failed to perform full synchronization");
      throw error;
    }
  };

  // Error handling
  const clearError = (resource: string): void => {
    dispatch({ type: "CLEAR_ERROR", payload: resource });
  };

  // Cache management
  const invalidateCache = (resource: ResourceType, id?: string): void => {
    dataLayer.invalidateCache(resource, id);
  };

  const actions: UnifiedContextActions = {
    create,
    read,
    update,
    delete: deleteResource,
    sync,
    forceSyncAll,
    clearError,
    loadAllData,
    refreshData,
    invalidateCache,
  };

  return (
    <UnifiedContext.Provider value={{ state, actions }}>
      {children}
    </UnifiedContext.Provider>
  );
}

// Convenience hooks for specific resources
export function useTransactions() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    transactions: state.transactions,
    isLoading: state.loadingStates.transactions,
    error: state.errors.transactions,
    create: (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) =>
      actions.create("transactions", data),
    update: (id: string, data: Partial<Transaction>) =>
      actions.update("transactions", id, data),
    delete: (id: string) => actions.delete("transactions", id),
    refresh: () => actions.refreshData("transactions"),
  };
}

export function useAccounts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useAccounts must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    accounts: state.accounts,
    isLoading: state.loadingStates.accounts,
    error: state.errors.accounts,
    create: (data: Omit<Account, "id" | "createdAt" | "updatedAt">) =>
      actions.create("accounts", data),
    update: (id: string, data: Partial<Account>) =>
      actions.update("accounts", id, data),
    delete: (id: string) => actions.delete("accounts", id),
    refresh: () => actions.refreshData("accounts"),
    // Funcionalidades adicionais para compatibilidade com hook consolidado
    updateBalance: async (id: string, newBalance: number) => {
      return await actions.update("accounts", id, { balance: newBalance });
    },
    transferBetweenAccounts: async (
      fromId: string,
      toId: string,
      amount: number,
      description?: string,
    ) => {
      const fromAccount = state.accounts.find((a) => a.id === fromId);
      const toAccount = state.accounts.find((a) => a.id === toId);

      if (!fromAccount || !toAccount) {
        throw new Error("Conta não encontrada");
      }

      if (fromAccount.balance < amount) {
        throw new Error("Saldo insuficiente");
      }

      await actions.update("accounts", fromId, {
        balance: fromAccount.balance - amount,
      });
      await actions.update("accounts", toId, {
        balance: toAccount.balance + amount,
      });

      return true;
    },
    toggleAccountStatus: async (id: string) => {
      const account = state.accounts.find((a) => a.id === id);
      if (!account) throw new Error("Conta não encontrada");

      const newStatus = account.status === "active" ? "inactive" : "active";
      return await actions.update("accounts", id, { status: newStatus });
    },
    searchAccounts: async (filters: any) => {
      return state.accounts.filter((account) => {
        if (filters.type && account.type !== filters.type) return false;
        if (filters.status && account.status !== filters.status) return false;
        if (
          filters.bankName &&
          !account.bankName
            ?.toLowerCase()
            .includes(filters.bankName.toLowerCase())
        )
          return false;
        return true;
      });
    },
    getStats: async () => {
      const totalBalance = state.accounts.reduce(
        (sum, account) => sum + account.balance,
        0,
      );
      const activeAccounts = state.accounts.filter(
        (account) => account.status === "active",
      ).length;

      return {
        totalBalance,
        totalAccounts: state.accounts.length,
        activeAccounts,
        accountsByType: {},
        balanceByType: {},
      };
    },
    isOnline: true, // Assumindo online por padrão no contexto
    syncWithBackend: async () => {
      await actions.refreshData("accounts");
    },
  };
}

export function useContacts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useContacts must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    contacts: state.contacts,
    isLoading: state.loadingStates.contacts,
    error: state.errors.contacts,
    create: (data: Omit<Contact, "id" | "createdAt" | "updatedAt">) =>
      actions.create("contacts", data),
    update: (id: string, data: Partial<Contact>) =>
      actions.update("contacts", id, data),
    delete: (id: string) => actions.delete("contacts", id),
    refresh: () => actions.refreshData("contacts"),
  };
}

export function useTrips() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useTrips must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    trips: state.trips,
    isLoading: state.loadingStates.trips,
    error: state.errors.trips,
    create: (data: Omit<Trip, "id" | "createdAt" | "updatedAt">) =>
      actions.create("trips", data),
    update: (id: string, data: Partial<Trip>) =>
      actions.update("trips", id, data),
    delete: (id: string) => actions.delete("trips", id),
    refresh: () => actions.refreshData("trips"),
  };
}

export function useGoals() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    goals: state.goals,
    isLoading: state.loadingStates.goals,
    error: state.errors.goals,
    create: (data: Omit<Goal, "id" | "createdAt" | "updatedAt">) =>
      actions.create("goals", data),
    update: (id: string, data: Partial<Goal>) =>
      actions.update("goals", id, data),
    delete: (id: string) => actions.delete("goals", id),
    refresh: () => actions.refreshData("goals"),
  };
}

export function useInvestments() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useInvestments must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    investments: state.investments,
    isLoading: state.loadingStates.investments,
    error: state.errors.investments,
    create: (data: Omit<Investment, "id" | "createdAt" | "updatedAt">) =>
      actions.create("investments", data),
    update: (id: string, data: Partial<Investment>) =>
      actions.update("investments", id, data),
    delete: (id: string) => actions.delete("investments", id),
    refresh: () => actions.refreshData("investments"),
  };
}

export function useSharedDebts() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useSharedDebts must be used within a UnifiedProvider");
  }
  const { state, actions } = context;
  return {
    sharedDebts: state.sharedDebts,
    isLoading: state.loadingStates["shared-debts"],
    error: state.errors["shared-debts"],
    create: (data: Omit<SharedDebt, "id" | "createdAt" | "updatedAt">) =>
      actions.create("shared-debts", data),
    update: (id: string, data: Partial<SharedDebt>) =>
      actions.update("shared-debts", id, data),
    delete: (id: string) => actions.delete("shared-debts", id),
    refresh: () => actions.refreshData("shared-debts"),
  };
}

export function useDashboardMetrics() {
  const context = useContext(UnifiedContext);
  if (context === undefined) {
    throw new Error("useDashboardMetrics must be used within a UnifiedProvider");
  }
  const { state } = context;
  
  const isLoading = state.loadingStates.transactions || state.loadingStates.accounts || state.loadingStates.goals;
  
  // Calcular métricas do mês atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const currentMonthTransactions = state.transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netIncome = totalIncome - totalExpenses;

  // Transações recentes (últimas 10)
  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Metas ativas - suportar diferentes estruturas
  const activeGoals = state.goals.filter((g) => {
    const current = g.current || g.currentAmount || 0;
    const target = g.target || g.targetAmount || 1;
    return current < target && !g.isCompleted;
  });

  // Análise de categorias
  const categoryBreakdown = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  // Análise de tendências (comparação com mês anterior)
  const lastMonth = new Date(currentYear, currentMonth - 1);
  const lastMonthTransactions = state.transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === lastMonth.getMonth() &&
      transactionDate.getFullYear() === lastMonth.getFullYear()
    );
  });

  const lastMonthIncome = lastMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const trendAnalysis = {
    incomeChange: lastMonthIncome > 0 ? ((totalIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0,
    expenseChange: lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
  };

  const metrics = {
    totalIncome,
    totalExpenses,
    netIncome,
    accountsBalance: state.accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
    transactionCount: state.transactions.length,
    activeGoalsCount: activeGoals.length,
  };

  return {
    metrics,
    isLoading,
    totalIncome,
    totalExpenses,
    netIncome,
    categoryBreakdown,
    recentTransactions,
    activeGoals,
    trendAnalysis,
  };
}
