"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Interfaces para relatórios
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
  category?: string;
  accountId?: string;
}

export interface ReportData {
  period: string;
  income: number;
  expenses: number;
  netFlow: number;
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    netFlow: number;
  }>;
  accountsBreakdown: Array<{
    name: string;
    balance: number;
    type: string;
  }>;
}

// Chaves de consulta para relatórios
export const reportKeys = {
  all: ['reports'] as const,
  dashboard: () => [...reportKeys.all, 'dashboard'] as const,
  period: (filters?: ReportFilters) => [...reportKeys.all, 'period', filters] as const,
  cashFlow: (filters?: ReportFilters) => [...reportKeys.all, 'cash-flow', filters] as const,
  categories: (filters?: ReportFilters) => [...reportKeys.all, 'categories', filters] as const,
};

// API functions
const reportApi = {
  getDashboard: async (filters?: ReportFilters): Promise<ReportData> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.period) params.append('period', filters.period);

    const response = await fetch(`/api/dashboard/summary?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar relatório: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar relatório');
    }

    return result.data;
  },

  getCashFlow: async (filters?: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/reports/cash-flow?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar fluxo de caixa: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar fluxo de caixa');
    }

    return result.data;
  },

  getCategorySpending: async (filters?: ReportFilters) => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`/api/reports/category-spending?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar gastos por categoria: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar gastos por categoria');
    }

    return result.data;
  },
};

/**
 * Hook para buscar dados do dashboard de relatórios
 */
export function useReportsDashboard(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.dashboard(),
    queryFn: () => reportApi.getDashboard(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      // Não retry em erros de autenticação
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook para buscar relatório de fluxo de caixa
 */
export function useCashFlowReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.cashFlow(filters),
    queryFn: () => reportApi.getCashFlow(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
    enabled: !!filters?.startDate && !!filters?.endDate,
  });
}

/**
 * Hook para buscar relatório de gastos por categoria
 */
export function useCategorySpendingReport(filters?: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.categories(filters),
    queryFn: () => reportApi.getCategorySpending(filters),
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

/**
 * Hook para forçar atualização de todos os relatórios
 */
export function useRefreshReports() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: reportKeys.dashboard() }),
        queryClient.refetchQueries({ queryKey: reportKeys.all }),
      ]);
      
      toast.success("Relatórios atualizados com sucesso!");
    } catch (error: any) {
      const message = error?.message || "Erro ao atualizar relatórios";
      toast.error(message);
    }
  };
}

// Exportar tipos
export type { ReportFilters, ReportData };