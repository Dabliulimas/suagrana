"use client";

import React, { useState, useEffect } from "react";
import { logComponents } from "../lib/logger";
import { UnifiedFinancialSystem } from "@/lib/unified-financial-system";
import { toast } from "sonner";

export interface IncomeSettings {
  monthlyIncome: number;
  additionalIncome: number;
  incomeFrequency: "monthly" | "weekly" | "biweekly";
  lastUpdated: string;
  isEstimated: boolean;
  notes?: string;
}

const DEFAULT_INCOME_SETTINGS: IncomeSettings = {
  monthlyIncome: 0,
  additionalIncome: 0,
  incomeFrequency: "monthly",
  lastUpdated: new Date().toISOString(),
  isEstimated: true,
  notes: "",
};

export function useIncomeSettings() {
  const [incomeSettings, setIncomeSettings] = useState<IncomeSettings>(
    DEFAULT_INCOME_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load income settings
  useEffect(() => {
    const loadIncomeSettings = async () => {
      try {
        const financialSystem = UnifiedFinancialSystem.getInstance();
        const saved = await financialSystem.getUserSettings("income");
        if (saved && saved.data) {
          setIncomeSettings(saved.data);
        }
      } catch (error) {
        logComponents.error("Error loading income settings:", error);
        toast.error("Erro ao carregar configuracoes de renda");
      } finally {
        setIsLoading(false);
      }
    };

    loadIncomeSettings();
  }, []);

  // Save income settings
  const saveIncomeSettings = async (settings: Partial<IncomeSettings>) => {
    try {
      const updatedSettings = {
        ...incomeSettings,
        ...settings,
        lastUpdated: new Date().toISOString(),
      };

      const financialSystem = UnifiedFinancialSystem.getInstance();
      await financialSystem.saveUserSettings("income", updatedSettings);
      setIncomeSettings(updatedSettings);
      toast.success("Configuracoes de renda salvas com sucesso");
      return true;
    } catch (error) {
      logComponents.error("Error saving income settings:", error);
      toast.error("Erro ao salvar configuracoes de renda");
      return false;
    }
  };

  // Calculate total monthly income
  const getTotalMonthlyIncome = () => {
    let total = incomeSettings.monthlyIncome;

    // Convert additional income to monthly based on frequency
    switch (incomeSettings.incomeFrequency) {
      case "weekly":
        total += incomeSettings.additionalIncome * 4.33; // Average weeks per month
        break;
      case "biweekly":
        total += incomeSettings.additionalIncome * 2.17; // Average biweeks per month
        break;
      case "monthly":
      default:
        total += incomeSettings.additionalIncome;
        break;
    }

    return total;
  };

  // Check if income is configured
  const hasIncomeConfigured = () => {
    return (
      incomeSettings.monthlyIncome > 0 || incomeSettings.additionalIncome > 0
    );
  };

  // Get income status
  const getIncomeStatus = () => {
    if (!hasIncomeConfigured()) {
      return {
        status: "not_configured" as const,
        message: "Renda nao configurada",
        color: "text-red-600",
      };
    }

    if (incomeSettings.isEstimated) {
      return {
        status: "estimated" as const,
        message: "Renda estimada",
        color: "text-yellow-600",
      };
    }

    return {
      status: "configured" as const,
      message: "Renda configurada",
      color: "text-green-600",
    };
  };

  return {
    incomeSettings,
    isLoading,
    saveIncomeSettings,
    getTotalMonthlyIncome,
    hasIncomeConfigured,
    getIncomeStatus,
  };
}
