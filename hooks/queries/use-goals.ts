"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logComponents } from "../../lib/logger";
import { type Goal } from "../../lib/storage";
import { UnifiedFinancialSystem } from "@/lib/unified-financial-system";
import { queryKeys, invalidateQueries } from "../../lib/react-query/query-client";
import { toast } from "sonner";

// Hook para buscar todas as metas
export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals.lists(),
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.getGoals();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar uma meta específica
export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id),
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    const goals = await financialSystem.getGoals();
      return goals.find((g) => g.id === id) || null;
    },
    enabled: !!id,
  });
}

// Hook para criar meta
export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.saveGoal(goal);
    },
    onSuccess: () => {
      invalidateQueries.goals();
      invalidateQueries.calculations();
      toast.success("Meta criada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta");
    },
  });
}

// Hook para atualizar meta
export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Goal> }) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.updateGoal(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(id) });
      invalidateQueries.goals();
      invalidateQueries.calculations();
      toast.success("Meta atualizada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao atualizar meta:", error);
      toast.error("Erro ao atualizar meta");
    },
  });
}

// Hook para deletar meta
export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.deleteGoal(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.goals.detail(id) });
      invalidateQueries.goals();
      invalidateQueries.calculations();
      toast.success("Meta deletada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao deletar meta:", error);
      toast.error("Erro ao deletar meta");
    },
  });
}

// Hook para buscar metas ativas
export function useActiveGoals() {
  return useQuery({
    queryKey: [...queryKeys.goals.lists(), "active"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const goals = await financialSystem.getGoals();
      const now = new Date();

      return goals.filter((goal) => {
        // Considerar meta ativa se não tem deadline ou se o deadline ainda não passou
        if (!goal.deadline) return true;
        const deadline = new Date(goal.deadline);
        return deadline >= now;
      });
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para buscar progresso das metas
export function useGoalsProgress() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "goals-progress"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const goals = await financialSystem.getGoals();

      if (goals.length === 0) {
        return {
          totalGoals: 0,
          completedGoals: 0,
          activeGoals: 0,
          overallProgress: 0,
          totalTarget: 0,
          totalCurrent: 0,
          averageProgress: 0,
        };
      }

      const now = new Date();
      let completedGoals = 0;
      let activeGoals = 0;
      let totalTarget = 0;
      let totalCurrent = 0;

      const goalsWithProgress = goals.map((goal) => {
        const target = goal.targetAmount || goal.target || 0;
        const current = goal.currentAmount || goal.current || 0;
        const progress = target > 0 ? (current / target) * 100 : 0;

        totalTarget += target;
        totalCurrent += current;

        const isCompleted = progress >= 100;
        const isActive = !goal.deadline || new Date(goal.deadline) >= now;

        if (isCompleted) completedGoals++;
        if (isActive) activeGoals++;

        return {
          ...goal,
          progress,
          isCompleted,
          isActive,
          target,
          current,
        };
      });

      const overallProgress =
        totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
      const averageProgress =
        goals.length > 0
          ? goalsWithProgress.reduce((sum, g) => sum + g.progress, 0) /
            goals.length
          : 0;

      return {
        totalGoals: goals.length,
        completedGoals,
        activeGoals,
        overallProgress,
        totalTarget,
        totalCurrent,
        averageProgress,
        goals: goalsWithProgress,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para buscar metas por categoria
export function useGoalsByCategory() {
  return useQuery({
    queryKey: [...queryKeys.goals.lists(), "by-category"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const goals = await financialSystem.getGoals();

      const goalsByCategory = goals.reduce(
        (acc, goal) => {
          const category = goal.category || "Sem categoria";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(goal);
          return acc;
        },
        {} as Record<string, Goal[]>,
      );

      return goalsByCategory;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar metas próximas do prazo
export function useGoalsNearDeadline(daysThreshold: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.goals.lists(), "near-deadline", daysThreshold],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const goals = await financialSystem.getGoals();
      const now = new Date();
      const thresholdDate = new Date(
        now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
      );

      return goals
        .filter((goal) => {
          if (!goal.deadline) return false;
          const deadline = new Date(goal.deadline);
          return deadline <= thresholdDate && deadline >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(a.deadline!).getTime();
          const dateB = new Date(b.deadline!).getTime();
          return dateA - dateB;
        });
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para dados urgentes
  });
}

// Hook para buscar estatísticas das metas
export function useGoalsStats() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "goals-stats"],
    queryFn: async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const goals = await financialSystem.getGoals();

      if (goals.length === 0) {
        return {
          totalGoals: 0,
          averageTarget: 0,
          largestGoal: 0,
          smallestGoal: 0,
          categoryDistribution: {},
          completionRate: 0,
        };
      }

      const targets = goals.map((g) => g.targetAmount || g.target || 0);
      const totalTarget = targets.reduce((sum, target) => sum + target, 0);
      const averageTarget = totalTarget / goals.length;
      const largestGoal = Math.max(...targets);
      const smallestGoal = Math.min(...targets.filter((t) => t > 0));

      const categoryDistribution = goals.reduce(
        (acc, goal) => {
          const category = goal.category || "Sem categoria";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const completedGoals = goals.filter((goal) => {
        const target = goal.targetAmount || goal.target || 0;
        const current = goal.currentAmount || goal.current || 0;
        return target > 0 && current >= target;
      }).length;

      const completionRate =
        goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

      return {
        totalGoals: goals.length,
        averageTarget,
        largestGoal,
        smallestGoal,
        categoryDistribution,
        completionRate,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
