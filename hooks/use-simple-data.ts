"use client";

import { useState, useEffect } from "react";

import { logComponents } from "../../lib/logger";
// Tipos simples
interface SimpleTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "shared";
  category: string;
  date: string;
  createdAt: string;
}

interface SimpleAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface SimpleGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  status: string;
}

interface SimpleInvestment {
  id: string;
  name: string;
  currentValue: number;
}

export function useSimpleData() {
  const [data, setData] = useState({
    transactions: [] as SimpleTransaction[],
    accounts: [] as SimpleAccount[],
    goals: [] as SimpleGoal[],
    investments: [] as SimpleInvestment[],
    loading: true,
    error: null as string | null,
  });

  // Função para buscar dados
  const fetchData = async () => {
    console.log("🔄 Buscando dados...");
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Buscar transações
      let transactions: SimpleTransaction[] = [];
      try {
        const transRes = await fetch("/api/transactions");
        if (transRes.ok) {
          const transData = await transRes.json();
          transactions = transData.transactions || [];
          console.log("✅ Transações carregadas:", transactions.length);
        }
      } catch (e) {
        console.warn("⚠️ Erro ao carregar transações:", e);
      }

      // Buscar contas
      let accounts: SimpleAccount[] = [];
      try {
        const accRes = await fetch("/api/accounts");
        if (accRes.ok) {
          const accData = await accRes.json();
          accounts = accData.accounts || [];
          console.log("✅ Contas carregadas:", accounts.length);
        }
      } catch (e) {
        console.warn("⚠️ Erro ao carregar contas:", e);
      }

      // Buscar metas
      let goals: SimpleGoal[] = [];
      try {
        const goalsRes = await fetch("/api/goals");
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json();
          goals = goalsData.goals || [];
          console.log("✅ Metas carregadas:", goals.length);
        }
      } catch (e) {
        console.warn("⚠️ Erro ao carregar metas:", e);
      }

      // Buscar investimentos
      let investments: SimpleInvestment[] = [];
      try {
        const invRes = await fetch("/api/investments");
        if (invRes.ok) {
          const invData = await invRes.json();
          investments = invData.investments || [];
          console.log("✅ Investimentos carregados:", investments.length);
        }
      } catch (e) {
        console.warn("⚠️ Erro ao carregar investimentos:", e);
      }

      // Atualizar estado
      setData({
        transactions,
        accounts,
        goals,
        investments,
        loading: false,
        error: null,
      });

      console.log("🎉 Todos os dados carregados com sucesso!");
    } catch (error) {
      logComponents.error("❌ Erro geral:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }));
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, []);

  // Calcular métricas simples
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = data.transactions.filter((t) =>
    t.date.startsWith(currentMonth),
  );

  const totalIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense" || t.type === "shared")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyBalance = totalIncome - totalExpenses;
  const totalBalance = data.accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0,
  );
  const totalInvestments = data.investments.reduce(
    (sum, inv) => sum + Number(inv.currentValue),
    0,
  );
  const netWorth = totalBalance + totalInvestments;

  const recentTransactions = data.transactions
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return {
    // Dados brutos
    ...data,

    // Métricas calculadas
    totalIncome,
    totalExpenses,
    monthlyBalance,
    totalBalance,
    totalInvestments,
    netWorth,
    recentTransactions,
    currentMonthTransactions,

    // Contadores
    incomeCount: currentMonthTransactions.filter((t) => t.type === "income")
      .length,
    expenseCount: currentMonthTransactions.filter(
      (t) => t.type === "expense" || t.type === "shared",
    ).length,

    // Função para recarregar
    refresh: fetchData,
  };
}
