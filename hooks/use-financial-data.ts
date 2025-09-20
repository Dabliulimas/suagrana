"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../lib/logger";
import type { BudgetSummary } from "./financial/use-budget-data";
// Removido: dados de fallback não são mais usados - apenas banco de dados

// Tipos completos e profissionais
interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "shared";
  category: string;
  date: string;
  accountId: string;
  account?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  bank?: string;
  createdAt: string;
  updatedAt: string;
}

interface Goal {
  id: string;
  name: string;
  description?: string;
  target: number;
  current: number;
  targetDate?: string;
  priority: "low" | "medium" | "high";
  status: "active" | "completed" | "paused";
  createdAt: string;
  updatedAt: string;
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Dados de fallback para orçamento
const fallbackBudgetData: BudgetSummary = {
  totalBudgeted: 0,
  totalSpent: 0,
  remaining: 0,
  categories: [],
  month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  year: new Date().getFullYear()
};

// Sistema de cache e sincronização profissional
class FinancialDataManager {
  private static instance: FinancialDataManager;
  private cache = new Map<string, any>();
  private listeners = new Set<() => void>();
  private lastFetch = new Map<string, number>();
  private readonly CACHE_DURATION = 30000; // 30 segundos

  static getInstance(): FinancialDataManager {
    if (!FinancialDataManager.instance) {
      FinancialDataManager.instance = new FinancialDataManager();
    }
    return FinancialDataManager.instance;
  }

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((callback) => callback());
  }

  private async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const lastFetchTime = this.lastFetch.get(key) || 0;

    // Se tem cache válido, usar
    if (this.cache.has(key) && now - lastFetchTime < this.CACHE_DURATION) {
      return this.cache.get(key);
    }

    try {
      const data = await fetcher();
      this.cache.set(key, data);
      this.lastFetch.set(key, now);
      return data;
    } catch (error) {
      console.warn(`Erro ao buscar ${key}:`, error);
      const cachedData = this.cache.get(key);
      return cachedData || [];
    }
  }

  async fetchTransactions(): Promise<Transaction[]> {
    return this.fetchWithCache("transactions", async () => {
      const { default: apiClient } = await import("../lib/api-client");
      const response = await apiClient.get("/transactions");
      const transactions = response.data?.data?.transactions || [];
      console.log("📊 Carregadas", transactions.length, "transações do banco de dados");
      return transactions;
    });
  }

  async fetchAccounts(): Promise<Account[]> {
    return this.fetchWithCache("accounts", async () => {
      const { default: apiClient } = await import("../lib/api-client");
      const response = await apiClient.get("/accounts");
      const accounts = response.data?.data?.accounts || [];
      console.log("🏦 Carregadas", accounts.length, "contas do banco de dados");
      return accounts;
    });
  }

  async fetchGoals(): Promise<Goal[]> {
    return this.fetchWithCache("goals", async () => {
      const { default: apiClient } = await import("../lib/api-client");
      const response = await apiClient.get("/goals");
      const goals = response.data?.data?.goals || [];
      console.log("🎯 Carregadas", goals.length, "metas do banco de dados");
      return goals;
    });
  }

  async fetchInvestments(): Promise<Investment[]> {
    return this.fetchWithCache("investments", async () => {
      const { default: apiClient } = await import("../lib/api-client");
      const response = await apiClient.get("/investments");
      const investments = response.data?.data?.investments || [];
      console.log("💰 Carregados", investments.length, "investimentos do banco de dados");
      return investments;
    });
  }

  async fetchContacts(): Promise<Contact[]> {
    return this.fetchWithCache("contacts", async () => {
      const { default: apiClient } = await import("../lib/api-client");
      const response = await apiClient.get("/contacts");
      const contacts = response.data?.data?.contacts || [];
      console.log("👥 Carregados", contacts.length, "contatos do banco de dados");
      return contacts;
    });
  }

  async createTransaction(
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction> {
    const { default: apiClient } = await import("../lib/api-client");
    
    const response = await apiClient.post("/transactions", {
      ...data,
      userId: "user_1",
      date: data.date instanceof Date ? data.date.toISOString() : data.date,
    });

    // Invalidar cache
    this.invalidateCache(["transactions", "accounts"]);
    this.notify();

    return response.data?.data?.transaction || response.data?.transaction;
  }

  private invalidateCache(keys: string[]) {
    keys.forEach((key) => {
      this.cache.delete(key);
      this.lastFetch.delete(key);
    });
  }

  async refreshAll(): Promise<void> {
    // Limpar todo o cache
    this.cache.clear();
    this.lastFetch.clear();

    // Recarregar dados
    await Promise.all([
      this.fetchTransactions(),
      this.fetchAccounts(),
      this.fetchGoals(),
      this.fetchInvestments(),
      this.fetchContacts(),
    ]);

    this.notify();
  }
}

const dataManager = FinancialDataManager.getInstance();

export function useFinancialData() {
  const [state, setState] = useState({
    transactions: [] as Transaction[],
    accounts: [] as Account[],
    goals: [] as Goal[],
    investments: [] as Investment[],
    contacts: [] as Contact[],
    loading: true,
    error: null as string | null,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  // Função para forçar re-render
  const forceUpdate = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Carregar dados
  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [transactions, accounts, goals, investments, contacts] =
        await Promise.all([
          dataManager.fetchTransactions(),
          dataManager.fetchAccounts(),
          dataManager.fetchGoals(),
          dataManager.fetchInvestments(),
          dataManager.fetchContacts(),
        ]);

      setState({
        transactions: transactions || [],
        accounts: accounts || [],
        goals: goals || [],
        investments: investments || [],
        contacts: contacts || [],
        loading: false,
        error: null,
      });

      console.log("✅ Dados carregados:", {
        transactions: transactions?.length || 0,
        accounts: accounts?.length || 0,
        goals: goals?.length || 0,
        investments: investments?.length || 0,
        contacts: contacts?.length || 0,
      });
    } catch (error) {
      logComponents.error("❌ Erro ao carregar dados:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }));
    }
  }, []);

  // Subscrever mudanças
  useEffect(() => {
    const unsubscribe = dataManager.subscribe(forceUpdate);
    loadData();
    return unsubscribe;
  }, []);

  // Recarregar quando refreshKey mudar
  useEffect(() => {
    if (refreshKey > 0) {
      loadData();
    }
  }, [refreshKey]);

  // Calcular métricas avançadas
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = (state.transactions || []).filter((t) =>
    t.date.startsWith(currentMonth),
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyBalance = totalIncome - totalExpenses;
  const totalBalance = (state.accounts || []).reduce(
    (sum, acc) => sum + Number(acc.balance),
    0,
  );
  const totalInvestments = (state.investments || []).reduce(
    (sum, inv) => sum + Number(inv.currentValue),
    0,
  );
  const netWorth = totalBalance + totalInvestments;

  const recentTransactions = (state.transactions || [])
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 20);

  const activeGoals = (state.goals || []).filter((g) => g.status === "active");
  const sharedExpenses = currentMonthTransactions.filter(
    (t) => t.type === "shared",
  );
  const totalSharedExpenses = sharedExpenses.reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  // Funções de ação
  const createTransaction = useCallback(async (data: any) => {
    try {
      await dataManager.createTransaction(data);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Erro ao criar transação",
      }));
      throw error;
    }
  }, []);

  const refresh = useCallback(async () => {
    await dataManager.refreshAll();
  }, []);

  return {
    // Dados
    transactions: state.transactions || [],
    accounts: state.accounts || [],
    goals: state.goals || [],
    investments: state.investments || [],
    contacts: state.contacts || [],
    budgetData: fallbackBudgetData, // Dados de orçamento de fallback

    // Estado
    loading: state.loading,
    error: state.error,

    // Métricas calculadas
    totalIncome,
    totalExpenses,
    monthlyBalance,
    totalBalance,
    totalInvestments,
    netWorth,
    recentTransactions,
    currentMonthTransactions,
    activeGoals,
    sharedExpenses,
    totalSharedExpenses,

    // Contadores
    transactionCount: currentMonthTransactions.length,
    incomeTransactionCount: currentMonthTransactions.filter(
      (t) => t.type === "income",
    ).length,
    expenseTransactionCount: currentMonthTransactions.filter(
      (t) => t.type === "expense" || t.type === "shared",
    ).length,

    // Funções
    createTransaction,
    refresh,
    refreshData: refresh, // Alias para compatibilidade
    clearError: () => setState((prev) => ({ ...prev, error: null })),
  };
}
