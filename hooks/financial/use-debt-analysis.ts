"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { storage } from "../../../lib/storage";
import { dataService } from "../../../lib/services/data-service";

export interface Debt {
  id: string;
  creditor: string;
  amount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  type: "credit_card" | "loan" | "financing" | "other";
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtAlert {
  id: string;
  type: "overdue" | "due_soon" | "high_interest" | "payment_capacity";
  severity: "low" | "medium" | "high";
  title: string;
  message: string;
  debtId?: string;
  suggestedAction?: string;
}

export interface PaymentStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  estimatedSavings?: number;
  timeToPayoff?: number;
}

export interface DebtAnalysis {
  totalDebt: number;
  monthlyPayments: number;
  averageInterestRate: number;
  paymentToIncomeRatio: number;
  alerts: DebtAlert[];
  strategies: PaymentStrategy[];
  projectedPayoffDate: string;
}

export function useDebtAnalysis() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [analysis, setAnalysis] = useState<DebtAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDebts = async () => {
    try {
      if (typeof window === "undefined") return;
      const savedDebts = await dataService.getUserSettings("debts");
      if (savedDebts && savedDebts.data) {
        const parsedDebts = Array.isArray(savedDebts.data) ? savedDebts.data : [];
        setDebts(parsedDebts);
        await analyzeDebts(parsedDebts);
      } else {
        setDebts([]);
        setAnalysis(null);
      }
    } catch (error) {
      logComponents.error("Error loading debts:", error);
      setDebts([]);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeDebts = async (debtList: Debt[]) => {
    if (debtList.length === 0) {
      setAnalysis(null);
      return;
    }

    const totalDebt = debtList.reduce((sum, debt) => sum + debt.amount, 0);
    const monthlyPayments = debtList.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    const averageInterestRate =
      debtList.reduce((sum, debt) => sum + debt.interestRate, 0) /
      debtList.length;

    const incomeSettings = await dataService.getUserSettings("income");
    const monthlyIncome = incomeSettings?.data?.monthlyIncome || 0;
    const paymentToIncomeRatio =
      monthlyIncome > 0 ? (monthlyPayments / monthlyIncome) * 100 : 0;

    const alerts = generateAlerts(debtList, monthlyIncome);
    const strategies = await generateStrategies(debtList, monthlyIncome);
    const projectedPayoffDate = calculatePayoffDate(debtList);

    setAnalysis({
      totalDebt,
      monthlyPayments,
      averageInterestRate,
      paymentToIncomeRatio,
      alerts,
      strategies,
      projectedPayoffDate,
    });
  };

  const generateAlerts = (
    debtList: Debt[],
    monthlyIncome: number,
  ): DebtAlert[] => {
    const alerts: DebtAlert[] = [];
    const today = new Date();

    debtList.forEach((debt) => {
      const dueDate = new Date(debt.dueDate);
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilDue < 0) {
        alerts.push({
          id: `overdue-${debt.id}`,
          type: "overdue",
          severity: "high",
          title: "Divida em Atraso",
          message: `A divida com ${debt.creditor} esta ${Math.abs(daysUntilDue)} dias em atraso.`,
          debtId: debt.id,
          suggestedAction: "Entrar em contato imediatamente para negociar",
        });
      } else if (daysUntilDue <= 7) {
        alerts.push({
          id: `due-soon-${debt.id}`,
          type: "due_soon",
          severity: "medium",
          title: "Vencimento Proximo",
          message: `A divida com ${debt.creditor} vence em ${daysUntilDue} dias.`,
          debtId: debt.id,
          suggestedAction: "Preparar pagamento",
        });
      }

      if (debt.interestRate > 5) {
        alerts.push({
          id: `high-interest-${debt.id}`,
          type: "high_interest",
          severity: "medium",
          title: "Taxa de Juros Alta",
          message: `A divida com ${debt.creditor} tem taxa de ${debt.interestRate}% ao mes.`,
          debtId: debt.id,
          suggestedAction: "Considerar renegociacao ou quitacao antecipada",
        });
      }
    });

    const totalPayments = debtList.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    if (monthlyIncome > 0 && totalPayments / monthlyIncome > 0.3) {
      alerts.push({
        id: "payment-capacity",
        type: "payment_capacity",
        severity: "high",
        title: "Capacidade de Pagamento Comprometida",
        message:
          "Sua capacidade de pagamento esta comprometida com base na renda atual.",
        suggestedAction:
          "Revisar orcamento e considerar renegociacao de dividas",
      });
    }

    return alerts;
  };

  const generateStrategies = async (
    debtList: Debt[],
    monthlyIncome: number,
  ): Promise<PaymentStrategy[]> => {
    const strategies: PaymentStrategy[] = [];

    if (debtList.length === 0) return strategies;

    const transactions = await dataService.getTransactions();
    const lastMonthExpenses = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const extraPayment = Math.max(
      0,
      monthlyIncome -
        lastMonthExpenses -
        debtList.reduce((sum, debt) => sum + debt.minimumPayment, 0),
    );

    if (extraPayment > 100) {
      const highestInterestDebt = debtList.reduce((prev, current) =>
        prev.interestRate > current.interestRate ? prev : current,
      );

      strategies.push({
        id: "extra-payment",
        name: "Pagamento Extra",
        description: `Aplicar R$ ${extraPayment.toFixed(2)} extras na divida com maior juros (${highestInterestDebt.creditor}).`,
        priority: 1,
        estimatedSavings:
          extraPayment * 12 * (highestInterestDebt.interestRate / 100),
      });
    }

    const sortedByInterest = [...debtList].sort(
      (a, b) => b.interestRate - a.interestRate,
    );
    if (sortedByInterest.length > 1) {
      const highestInterest = sortedByInterest[0];
      strategies.push({
        id: "avalanche",
        name: "Estrategia Avalanche",
        description: `Foque no pagamento da divida com ${highestInterest.creditor} (${highestInterest.interestRate}% juros) primeiro.`,
        priority: 2,
      });
    }

    const sortedByAmount = [...debtList].sort((a, b) => a.amount - b.amount);
    if (sortedByAmount.length > 1) {
      const smallestDebt = sortedByAmount[0];
      strategies.push({
        id: "snowball",
        name: "Estrategia Snowball",
        description: `Quite primeiro a menor divida (${smallestDebt.creditor} - R$ ${smallestDebt.amount.toFixed(2)}) para ganhar momentum.`,
        priority: 3,
      });
    }

    debtList.forEach((debt) => {
      if (debt.interestRate > 3) {
        strategies.push({
          id: `negotiate-${debt.id}`,
          name: "Oportunidade de Negociacao",
          description: `Negocie desconto ou reducao de juros com ${debt.creditor}.`,
          priority: 4,
        });
      }
    });

    return strategies.sort((a, b) => a.priority - b.priority);
  };

  const calculatePayoffDate = (debtList: Debt[]): string => {
    if (debtList.length === 0) return "";

    const totalDebt = debtList.reduce((sum, debt) => sum + debt.amount, 0);
    const totalMinimumPayment = debtList.reduce(
      (sum, debt) => sum + debt.minimumPayment,
      0,
    );
    const averageInterestRate =
      debtList.reduce((sum, debt) => sum + debt.interestRate, 0) /
      debtList.length;

    if (totalMinimumPayment <= 0) return "Indefinido";

    const monthlyInterestRate = averageInterestRate / 100;
    const months =
      Math.log(1 + (totalDebt * monthlyInterestRate) / totalMinimumPayment) /
      Math.log(1 + monthlyInterestRate);

    if (!isFinite(months) || months <= 0) return "Indefinido";

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(months));

    return payoffDate.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
    });
  };

  const addDebt = async (debtData: Omit<Debt, "id" | "createdAt" | "updatedAt">) => {
    const newDebt: Debt = {
      ...debtData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDebts = [...debts, newDebt];
    setDebts(updatedDebts);
    await dataService.saveUserSettings("debts", updatedDebts);
    await analyzeDebts(updatedDebts);

    return newDebt;
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    const updatedDebts = debts.map((debt) =>
      debt.id === id
        ? { ...debt, ...updates, updatedAt: new Date().toISOString() }
        : debt,
    );

    setDebts(updatedDebts);
    await dataService.saveUserSettings("debts", updatedDebts);
    await analyzeDebts(updatedDebts);
  };

  const deleteDebt = async (id: string) => {
    const updatedDebts = debts.filter((debt) => debt.id !== id);
    setDebts(updatedDebts);
    await dataService.saveUserSettings("debts", updatedDebts);
    await analyzeDebts(updatedDebts);
  };

  useEffect(() => {
    loadDebts().catch(console.error);
  }, []);

  return {
    debts,
    analysis,
    isLoading,
    addDebt,
    updateDebt,
    deleteDebt,
    refreshAnalysis: () => analyzeDebts(debts),
  };
}
