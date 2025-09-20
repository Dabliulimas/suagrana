"use client";

import { useState, useEffect, useCallback } from "react";

import { logComponents } from "../../lib/logger";
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

export function useDatabase() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar todos os dados em paralelo
      const [transactionsRes, accountsRes, goalsRes, investmentsRes] =
        await Promise.all([
          fetch("/api/transactions").catch(() => ({
            ok: false,
            json: () => ({ transactions: [] }),
          })),
          fetch("/api/accounts").catch(() => ({
            ok: false,
            json: () => ({ accounts: [] }),
          })),
          fetch("/api/goals").catch(() => ({
            ok: false,
            json: () => ({ goals: [] }),
          })),
          fetch("/api/investments").catch(() => ({
            ok: false,
            json: () => ({ investments: [] }),
          })),
        ]);

      const [transactionsData, accountsData, goalsData, investmentsData] =
        await Promise.all([
          transactionsRes.ok ? transactionsRes.json() : { transactions: [] },
          accountsRes.ok ? accountsRes.json() : { accounts: [] },
          goalsRes.ok ? goalsRes.json() : { goals: [] },
          investmentsRes.ok ? investmentsRes.json() : { investments: [] },
        ]);

      setTransactions(transactionsData.transactions || []);
      setAccounts(accountsData.accounts || []);
      setGoals(goalsData.goals || []);
      setInvestments(investmentsData.investments || []);

      console.log("✅ Dados carregados:", {
        transactions: transactionsData.transactions?.length || 0,
        accounts: accountsData.accounts?.length || 0,
        goals: goalsData.goals?.length || 0,
        investments: investmentsData.investments?.length || 0,
      });
    } catch (err) {
      logComponents.error("❌ Erro ao carregar dados:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calcular métricas
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter((t) =>
    t.date.startsWith(currentMonth),
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = totalIncome - totalExpenses;

  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const totalInvestments = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0,
  );
  const netWorth = totalBalance + totalInvestments;

  const recentTransactions = transactions
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return {
    // Dados
    transactions,
    accounts,
    goals,
    investments,
    loading,
    error,

    // Métricas calculadas
    totalIncome,
    totalExpenses,
    monthlyBalance,
    totalBalance,
    totalInvestments,
    netWorth,
    recentTransactions,
    currentMonthTransactions,

    // Funções
    refresh: fetchData,
  };
}
