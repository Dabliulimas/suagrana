"use client";

import { useState, useEffect, useCallback } from "react";
import { logComponents } from "../../../lib/logger";
import { dataService } from "../../../lib/services/data-service";
import type { Budget } from "../../../lib/storage";

export interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  color: string;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  categories: BudgetCategory[];
  month: string;
  year: number;
}

export function useBudgetData(month?: string, year?: number) {
  const [budgetData, setBudgetData] = useState<BudgetSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentDate = new Date();
  const targetMonth =
    month || (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const targetYear = year || currentDate.getFullYear();

  const loadBudgetData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar orçamentos do período
      const budgets = await dataService.getBudgets();
      const periodBudgets = budgets.filter((budget) => {
        const startDate = new Date(budget.startDate);
        const endDate = new Date(budget.endDate);
        const targetDate = new Date(targetYear, parseInt(targetMonth) - 1, 1);
        
        return targetDate >= startDate && targetDate <= endDate && budget.isActive;
      });

      if (periodBudgets.length === 0) {
        setBudgetData(null);
        setIsLoading(false);
        return;
      }

      // Buscar transações do período
      const transactions = await dataService.getTransactions();
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() + 1 === parseInt(targetMonth) &&
          transactionDate.getFullYear() === targetYear &&
          t.type === "expense"
        );
      });

      const spentByCategory: Record<string, number> = {};
      monthTransactions.forEach((transaction) => {
        const category = transaction.category;
        spentByCategory[category] =
          (spentByCategory[category] || 0) + transaction.amount;
      });

      // Converter orçamentos para categorias
      const categories: BudgetCategory[] = periodBudgets.map((budget) => ({
        id: budget.id,
        name: budget.category,
        budgeted: budget.amount,
        spent: spentByCategory[budget.category] || budget.spent,
        color: '#3B82F6' // Cor padrão, pode ser customizada
      }));

      const totalBudgeted = categories.reduce(
        (sum, cat) => sum + cat.budgeted,
        0,
      );
      const totalSpent = categories.reduce(
        (sum, cat) => sum + cat.spent,
        0,
      );
      const remaining = totalBudgeted - totalSpent;

      const budgetSummary: BudgetSummary = {
        totalBudgeted,
        totalSpent,
        remaining,
        categories,
        month: targetMonth,
        year: targetYear,
      };

      setBudgetData(budgetSummary);
    } catch (err) {
      logComponents.error("Error loading budget data:", err);
      setError("Erro ao carregar dados do orcamento");
      setBudgetData(null);
    } finally {
      setIsLoading(false);
    }
  }, [targetMonth, targetYear]);

  const addBudgetCategory = useCallback(
    async (category: Omit<BudgetCategory, "id" | "spent">) => {
      try {
        const startDate = new Date(targetYear, parseInt(targetMonth) - 1, 1);
        const endDate = new Date(targetYear, parseInt(targetMonth), 0); // Último dia do mês
        
        const newBudget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
          category: category.name,
          amount: category.budgeted,
          spent: 0,
          period: "monthly",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          description: `Orçamento para ${category.name}`,
          isActive: true
        };

        await dataService.saveBudget(newBudget);
        await loadBudgetData();
        return true;
      } catch (err) {
        logComponents.error("Error adding budget category:", err);
        return false;
      }
    },
    [targetMonth, targetYear, loadBudgetData],
  );

  const updateBudgetCategory = useCallback(
    async (categoryId: string, updates: Partial<BudgetCategory>) => {
      if (!budgetData) return false;

      try {
        const budgetUpdates: Partial<Budget> = {};
        
        if (updates.name) budgetUpdates.category = updates.name;
        if (updates.budgeted !== undefined) budgetUpdates.amount = updates.budgeted;
        if (updates.spent !== undefined) budgetUpdates.spent = updates.spent;

        await dataService.updateBudget(categoryId, budgetUpdates);
        await loadBudgetData();
        return true;
      } catch (err) {
        logComponents.error("Error updating budget category:", err);
        return false;
      }
    },
    [budgetData, targetMonth, targetYear, loadBudgetData],
  );

  const deleteBudgetCategory = useCallback(
    async (categoryId: string) => {
      if (!budgetData) return false;

      try {
        await dataService.deleteBudget(categoryId);
        await loadBudgetData();
        return true;
      } catch (err) {
        logComponents.error("Error deleting budget category:", err);
        return false;
      }
    },
    [budgetData, targetMonth, targetYear, loadBudgetData],
  );

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  return {
    budgetData,
    isLoading,
    error,
    refreshData: loadBudgetData,
    updateBudgetCategory,
    addBudgetCategory,
    deleteBudgetCategory,
  };
}

export function useBudgetSummary() {
  const { budgetData, isLoading } = useBudgetData();

  const summary = budgetData
    ? {
        totalBudgeted: budgetData.totalBudgeted,
        totalSpent: budgetData.totalSpent,
        remaining: budgetData.remaining,
        utilizationPercentage:
          budgetData.totalBudgeted > 0
            ? (budgetData.totalSpent / budgetData.totalBudgeted) * 100
            : 0,
        categoriesCount: budgetData.categories.length,
        overBudgetCategories: budgetData.categories.filter(
          (cat) => cat.spent > cat.budgeted,
        ).length,
      }
    : null;

  return {
    summary,
    isLoading,
  };
}
