"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logComponents } from "../../lib/logger";
import type { Investment } from "../../lib/storage";
import { UnifiedFinancialSystem } from "@/lib/unified-financial-system";
import { queryKeys, invalidateQueries } from "../../lib/react-query/query-client";
import { toast } from "sonner";

// Hook para buscar todos os investimentos
export function useInvestments() {
  return useQuery({
    queryKey: queryKeys.investments.lists(),
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.getInvestments();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar um investimento específico
export function useInvestment(id: string) {
  return useQuery({
    queryKey: queryKeys.investments.detail(id),
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    const investments = await financialSystem.getInvestments();
      return investments.find((i) => i.id === id) || null;
    },
    enabled: !!id,
  });
}

// Hook para criar investimento
export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (investment: Omit<Investment, "id">) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.saveInvestment(investment);
    },
    onSuccess: () => {
      invalidateQueries.investments();
      invalidateQueries.calculations();
      toast.success("Investimento criado com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao criar investimento:", error);
      toast.error("Erro ao criar investimento");
    },
  });
}

// Hook para atualizar investimento
export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Investment>;
    }) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      return await financialSystem.updateInvestment(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.investments.detail(id),
      });
      invalidateQueries.investments();
      invalidateQueries.calculations();
      toast.success("Investimento atualizado com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao atualizar investimento:", error);
      toast.error("Erro ao atualizar investimento");
    },
  });
}

// Hook para deletar investimento
export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      return await financialSystem.deleteInvestment(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.investments.detail(id) });
      invalidateQueries.investments();
      invalidateQueries.calculations();
      toast.success("Investimento deletado com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao deletar investimento:", error);
      toast.error("Erro ao deletar investimento");
    },
  });
}

// Hook para buscar valor total dos investimentos
export function useInvestmentsValue() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "investments-value"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const investments = await financialSystem.getInvestments();

      const totalValue = investments.reduce((sum, investment) => {
        return sum + (investment.currentValue || investment.totalValue || 0);
      }, 0);

      const totalInvested = investments.reduce((sum, investment) => {
        return sum + (investment.totalValue || 0);
      }, 0);

      const profit = totalValue - totalInvested;
      const profitPercentage =
        totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

      return {
        totalValue,
        totalInvested,
        profit,
        profitPercentage,
        investmentCount: investments.length,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para buscar investimentos por tipo/categoria
export function useInvestmentsByType() {
  return useQuery({
    queryKey: [...queryKeys.investments.lists(), "by-type"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const investments = await financialSystem.getInvestments();

      const investmentsByType = investments.reduce(
        (acc, investment) => {
          const type = investment.asset || investment.type || "other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(investment);
          return acc;
        },
        {} as Record<string, Investment[]>,
      );

      return investmentsByType;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar performance dos investimentos
export function useInvestmentsPerformance() {
  return useQuery({
    queryKey: [
      ...queryKeys.calculations.financial(),
      "investments-performance",
    ],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const investments = await financialSystem.getInvestments();

      const performance = investments.map((investment) => {
        const invested = investment.totalValue || 0;
        const current = investment.currentValue || invested;
        const profit = current - invested;
        const profitPercentage = invested > 0 ? (profit / invested) * 100 : 0;

        return {
          id: investment.id,
          asset: investment.asset,
          invested,
          current,
          profit,
          profitPercentage,
          operation: investment.operation,
        };
      });

      // Ordenar por performance (maior lucro percentual primeiro)
      performance.sort((a, b) => b.profitPercentage - a.profitPercentage);

      const bestPerformer = performance[0] || null;
      const worstPerformer = performance[performance.length - 1] || null;

      const averagePerformance =
        performance.length > 0
          ? performance.reduce((sum, p) => sum + p.profitPercentage, 0) /
            performance.length
          : 0;

      return {
        performance,
        bestPerformer,
        worstPerformer,
        averagePerformance,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar estatísticas dos investimentos
export function useInvestmentsStats() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "investments-stats"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const investments = await financialSystem.getInvestments();

      if (investments.length === 0) {
        return {
          totalInvestments: 0,
          totalValue: 0,
          averageInvestment: 0,
          largestInvestment: 0,
          smallestInvestment: 0,
          typeDistribution: {},
          operationDistribution: {},
        };
      }

      const values = investments.map((i) => i.totalValue || 0);
      const totalValue = values.reduce((sum, value) => sum + value, 0);
      const averageInvestment = totalValue / investments.length;
      const largestInvestment = Math.max(...values);
      const smallestInvestment = Math.min(...values);

      const typeDistribution = investments.reduce(
        (acc, investment) => {
          const type = investment.asset || investment.type || "other";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const operationDistribution = investments.reduce(
        (acc, investment) => {
          const operation = investment.operation || "unknown";
          acc[operation] = (acc[operation] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalInvestments: investments.length,
        totalValue,
        averageInvestment,
        largestInvestment,
        smallestInvestment,
        typeDistribution,
        operationDistribution,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
