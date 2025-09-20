"use client";

import { useState, useEffect } from "react";
import { logComponents } from "../../../lib/logger";
import { dataService } from "../../../lib/services/data-service";

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "weekly" | "biweekly" | "yearly";
  type: "salary" | "freelance" | "investment" | "rental" | "business" | "other";
  isActive: boolean;
  startDate: string;
  endDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeSettings {
  monthlyIncome: number;
  sources: IncomeSource[];
  taxRate: number;
  emergencyFundGoal: number;
  savingsGoal: number;
  lastUpdated: string;
}

const defaultSettings: IncomeSettings = {
  monthlyIncome: 0,
  sources: [],
  taxRate: 0,
  emergencyFundGoal: 0,
  savingsGoal: 0,
  lastUpdated: new Date().toISOString(),
};

export function useIncomeSettings() {
  const [settings, setSettings] = useState<IncomeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const financialSystem = UnifiedFinancialSystem.getInstance();
      const savedSettings = await financialSystem.getUserSettings("income");
      if (savedSettings && savedSettings.data) {
        setSettings(savedSettings.data);
      } else {
        setSettings(defaultSettings);
      }
    } catch (err) {
      logComponents.error("Error loading income settings:", err);
      setError("Erro ao carregar configuracoes de renda");
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<IncomeSettings>) => {
    try {
      setError(null);

      const updatedSettings = {
        ...settings,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      };

      const financialSystem = UnifiedFinancialSystem.getInstance();
      await financialSystem.saveUserSettings("income", updatedSettings);
      setSettings(updatedSettings);

      return true;
    } catch (err) {
      logComponents.error("Error saving income settings:", err);
      setError("Erro ao salvar configuracoes de renda");
      return false;
    }
  };

  const addIncomeSource = (
    sourceData: Omit<IncomeSource, "id" | "createdAt" | "updatedAt">,
  ) => {
    const newSource: IncomeSource = {
      ...sourceData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedSources = [...settings.sources, newSource];
    const monthlyIncome = calculateMonthlyIncome(updatedSources);

    return saveSettings({
      sources: updatedSources,
      monthlyIncome,
    });
  };

  const updateIncomeSource = (id: string, updates: Partial<IncomeSource>) => {
    const updatedSources = settings.sources.map((source) =>
      source.id === id
        ? { ...source, ...updates, updatedAt: new Date().toISOString() }
        : source,
    );

    const monthlyIncome = calculateMonthlyIncome(updatedSources);

    return saveSettings({
      sources: updatedSources,
      monthlyIncome,
    });
  };

  const deleteIncomeSource = (id: string) => {
    const updatedSources = settings.sources.filter(
      (source) => source.id !== id,
    );
    const monthlyIncome = calculateMonthlyIncome(updatedSources);

    return saveSettings({
      sources: updatedSources,
      monthlyIncome,
    });
  };

  const calculateMonthlyIncome = (sources: IncomeSource[]): number => {
    return sources
      .filter((source) => source.isActive)
      .reduce((total, source) => {
        let monthlyAmount = 0;

        switch (source.frequency) {
          case "monthly":
            monthlyAmount = source.amount;
            break;
          case "weekly":
            monthlyAmount = source.amount * 4.33; // Average weeks per month
            break;
          case "biweekly":
            monthlyAmount = source.amount * 2.17; // Average biweeks per month
            break;
          case "yearly":
            monthlyAmount = source.amount / 12;
            break;
          default:
            monthlyAmount = source.amount;
        }

        return total + monthlyAmount;
      }, 0);
  };

  const resetSettings = async () => {
    try {
      setError(null);
      const financialSystem = UnifiedFinancialSystem.getInstance();
      await financialSystem.saveUserSettings("income", defaultSettings);
      setSettings(defaultSettings);
      return true;
    } catch (err) {
      logComponents.error("Error resetting income settings:", err);
      setError("Erro ao resetar configuracoes de renda");
      return false;
    }
  };

  const getNetIncome = (): number => {
    const grossIncome = settings.monthlyIncome;
    const taxAmount = grossIncome * (settings.taxRate / 100);
    return grossIncome - taxAmount;
  };

  const getIncomeBreakdown = () => {
    const activeSourcesByType = settings.sources
      .filter((source) => source.isActive)
      .reduce(
        (acc, source) => {
          const monthlyAmount = calculateMonthlyIncome([source]);

          if (!acc[source.type]) {
            acc[source.type] = {
              type: source.type,
              amount: 0,
              sources: [],
            };
          }

          acc[source.type].amount += monthlyAmount;
          acc[source.type].sources.push({
            name: source.name,
            amount: monthlyAmount,
          });

          return acc;
        },
        {} as Record<
          string,
          {
            type: string;
            amount: number;
            sources: { name: string; amount: number }[];
          }
        >,
      );

    return Object.values(activeSourcesByType);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    resetSettings,
    getNetIncome,
    getIncomeBreakdown,
    refreshSettings: loadSettings,
  };
}
