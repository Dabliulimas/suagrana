"use client";

// SISTEMA FINANCEIRO ÚNICO E DEFINITIVO
// Este é o ÚNICO ponto de acesso aos dados financeiros

import { logComponents } from "../logger";
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
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank?: string;
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
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchaseDate: string;
}

class FinancialSystem {
  private static instance: FinancialSystem;
  private listeners: Set<() => void> = new Set();

  // Cache dos dados
  private cache = {
    transactions: [] as Transaction[],
    accounts: [] as Account[],
    goals: [] as Goal[],
    investments: [] as Investment[],
    lastUpdate: 0,
  };

  static getInstance(): FinancialSystem {
    if (!FinancialSystem.instance) {
      FinancialSystem.instance = new FinancialSystem();
    }
    return FinancialSystem.instance;
  }

  // Adicionar listener para mudanças
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notificar todos os listeners
  private notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }

  // Buscar dados das APIs
  private async fetchFromAPI<T>(endpoint: string): Promise<T[]> {
    try {
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) {
        console.warn(`API ${endpoint} falhou, retornando array vazio`);
        return [];
      }
      const data = await response.json();
      return data[endpoint] || [];
    } catch (error) {
      console.warn(`Erro na API ${endpoint}:`, error);
      return [];
    }
  }

  // Carregar todos os dados
  async loadAllData(): Promise<void> {
    console.log("🔄 Carregando dados do sistema...");

    try {
      const [transactions, accounts, goals, investments] = await Promise.all([
        this.fetchFromAPI<Transaction>("transactions"),
        this.fetchFromAPI<Account>("accounts"),
        this.fetchFromAPI<Goal>("goals"),
        this.fetchFromAPI<Investment>("investments"),
      ]);

      this.cache = {
        transactions,
        accounts,
        goals,
        investments,
        lastUpdate: Date.now(),
      };

      console.log("✅ Dados carregados:", {
        transactions: transactions.length,
        accounts: accounts.length,
        goals: goals.length,
        investments: investments.length,
      });

      this.notifyListeners();
    } catch (error) {
      logComponents.error("❌ Erro ao carregar dados:", error);
    }
  }

  // Criar transação
  async createTransaction(
    data: Omit<Transaction, "id" | "createdAt">,
  ): Promise<void> {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: "user_1",
          date: data.date instanceof Date ? data.date.toISOString() : data.date,
        }),
      });

      if (response.ok) {
        console.log("✅ Transação criada, recarregando dados...");
        await this.loadAllData(); // Recarregar tudo após criar
      }
    } catch (error) {
      logComponents.error("❌ Erro ao criar transação:", error);
      throw error;
    }
  }

  // Getters para os dados
  getTransactions(): Transaction[] {
    return this.cache.transactions;
  }

  getAccounts(): Account[] {
    return this.cache.accounts;
  }

  getGoals(): Goal[] {
    return this.cache.goals;
  }

  getInvestments(): Investment[] {
    return this.cache.investments;
  }

  // Métricas calculadas
  getMetrics() {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthTransactions = this.cache.transactions.filter((t) =>
      t.date.startsWith(currentMonth),
    );

    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyBalance = totalIncome - totalExpenses;
    const totalBalance = this.cache.accounts.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    const totalInvestments = this.cache.investments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0,
    );
    const netWorth = totalBalance + totalInvestments;

    const recentTransactions = this.cache.transactions
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      monthlyBalance,
      totalBalance,
      totalInvestments,
      netWorth,
      recentTransactions,
      currentMonthTransactions,
      activeGoals: this.cache.goals.filter((g) => g.status === "active"),
      transactionCount: currentMonthTransactions.length,
      incomeTransactionCount: currentMonthTransactions.filter(
        (t) => t.type === "income",
      ).length,
      expenseTransactionCount: currentMonthTransactions.filter(
        (t) => t.type === "expense" || t.type === "shared",
      ).length,
    };
  }

  // Forçar refresh
  async refresh(): Promise<void> {
    await this.loadAllData();
  }
}

export const financialSystem = FinancialSystem.getInstance();
