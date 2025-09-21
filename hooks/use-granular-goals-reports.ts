"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Goal } from "@/lib/types";
import { queryKeys, useGranularInvalidation } from "./use-granular-data";

export function useGranularGoals() {
  const { invalidateGoalRelated } = useGranularInvalidation();

  // Query para todas as metas
  const useGoalsList = (filters?: any) => {
    return useQuery({
      queryKey: queryKeys.goals.list(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(key, String(value));
            }
          });
        }

        const response = await fetch(`/api/goals?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao buscar metas');
        const result = await response.json();
        return result.data || result;
      },
      staleTime: 60000, // 1 minuto
      gcTime: 10 * 60 * 1000,
    });
  };

  // Query para metas ativas
  const useActiveGoals = () => {
    return useQuery({
      queryKey: queryKeys.goals.active(),
      queryFn: async () => {
        const response = await fetch('/api/goals?status=active');
        if (!response.ok) throw new Error('Erro ao buscar metas ativas');
        const result = await response.json();
        return result.data || result;
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Query para progresso geral das metas
  const useGoalsProgress = () => {
    return useQuery({
      queryKey: queryKeys.goals.progress(),
      queryFn: async () => {
        const response = await fetch('/api/goals/progress');
        if (!response.ok) throw new Error('Erro ao buscar progresso das metas');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Query para detalhes de uma meta específica
  const useGoalDetail = (id: string) => {
    return useQuery({
      queryKey: queryKeys.goals.detail(id),
      queryFn: async () => {
        const response = await fetch(`/api/goals/${id}`);
        if (!response.ok) throw new Error('Erro ao buscar detalhes da meta');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
      enabled: !!id,
    });
  };

  // Mutação para criar meta
  const useCreateGoal = () => {
    return useMutation({
      mutationFn: async (goalData: Omit<Goal, 'id'>) => {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });
        if (!response.ok) throw new Error('Erro ao criar meta');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateGoalRelated(variables);
      },
    });
  };

  // Mutação para atualizar meta
  const useUpdateGoal = () => {
    return useMutation({
      mutationFn: async ({ id, ...goalData }: Partial<Goal> & { id: string }) => {
        const response = await fetch(`/api/goals/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goalData),
        });
        if (!response.ok) throw new Error('Erro ao atualizar meta');
        return response.json();
      },
      onSuccess: (data, variables) => {
        invalidateGoalRelated(variables);
      },
    });
  };

  // Mutação para deletar meta
  const useDeleteGoal = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/goals/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao deletar meta');
        return response.json();
      },
      onSuccess: () => {
        invalidateGoalRelated();
      },
    });
  };

  return {
    useGoalsList,
    useActiveGoals,
    useGoalsProgress,
    useGoalDetail,
    useCreateGoal,
    useUpdateGoal,
    useDeleteGoal,
  };
}

export function useGranularReports() {
  // Query para dados do dashboard
  const useDashboardData = () => {
    return useQuery({
      queryKey: queryKeys.reports.dashboard(),
      queryFn: async () => {
        const response = await fetch('/api/dashboard/summary');
        if (!response.ok) throw new Error('Erro ao buscar dados do dashboard');
        return response.json();
      },
      staleTime: 60000, // 1 minuto
      gcTime: 10 * 60 * 1000,
    });
  };

  // Query para fluxo de caixa
  const useCashFlowReport = (startDate: string, endDate: string) => {
    return useQuery({
      queryKey: queryKeys.reports.cashFlow(startDate, endDate),
      queryFn: async () => {
        const response = await fetch(`/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
        if (!response.ok) throw new Error('Erro ao buscar relatório de fluxo de caixa');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
      enabled: !!startDate && !!endDate,
    });
  };

  // Query para gastos por categoria
  const useCategorySpendingReport = (period: string = 'current') => {
    return useQuery({
      queryKey: queryKeys.reports.categorySpending(period),
      queryFn: async () => {
        const response = await fetch(`/api/reports/category-spending?period=${period}`);
        if (!response.ok) throw new Error('Erro ao buscar relatório de gastos por categoria');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Query para visão geral mensal
  const useMonthlyOverview = (year: number, month: number) => {
    return useQuery({
      queryKey: queryKeys.reports.monthlyOverview(year, month),
      queryFn: async () => {
        const response = await fetch(`/api/reports/monthly-overview?year=${year}&month=${month}`);
        if (!response.ok) throw new Error('Erro ao buscar visão geral mensal');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
      enabled: !!year && !!month,
    });
  };

  // Query para comparação de períodos
  const usePeriodComparison = (currentPeriod: string, previousPeriod: string) => {
    return useQuery({
      queryKey: ['reports', 'periodComparison', currentPeriod, previousPeriod],
      queryFn: async () => {
        const response = await fetch(`/api/reports/period-comparison?current=${currentPeriod}&previous=${previousPeriod}`);
        if (!response.ok) throw new Error('Erro ao buscar comparação de períodos');
        return response.json();
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
      enabled: !!currentPeriod && !!previousPeriod,
    });
  };

  // Query para tendências
  const useTrendsReport = (period: string = '6months') => {
    return useQuery({
      queryKey: ['reports', 'trends', period],
      queryFn: async () => {
        const response = await fetch(`/api/reports/trends?period=${period}`);
        if (!response.ok) throw new Error('Erro ao buscar relatório de tendências');
        return response.json();
      },
      staleTime: 120000, // 2 minutos
      gcTime: 15 * 60 * 1000,
    });
  };

  // Hook para progresso das metas
  const useGoalProgress = () => {
    return useQuery({
      queryKey: queryKeys.goals.progress(),
      queryFn: async () => {
        const response = await fetch('/api/goals/progress');
        if (!response.ok) throw new Error('Erro ao buscar progresso das metas');
        const data = await response.json();
        
        return {
          activeGoals: data.activeGoals || 0,
          completedGoals: data.completedGoals || 0,
          averageProgress: data.averageProgress || 0,
          goals: data.goals || [],
          totalTargetAmount: data.totalTargetAmount || 0,
          totalCurrentAmount: data.totalCurrentAmount || 0,
        };
      },
      staleTime: 60000,
      gcTime: 10 * 60 * 1000,
    });
  };

  return {
    useDashboardData,
    useCashFlowReport,
    useCategorySpendingReport,
    useMonthlyOverview,
    usePeriodComparison,
    useTrendsReport,
    useGoalProgress,
  };
}