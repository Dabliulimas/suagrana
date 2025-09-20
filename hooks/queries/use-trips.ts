"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { storage, type Trip } from "../../lib/storage";
import { dataService } from "../../lib/services/data-service";
import { queryKeys, invalidateQueries } from "../../lib/react-query/query-client";
import { toast } from "sonner";
import { logComponents } from "../../lib/logger";

// Hook para buscar todas as viagens
export function useTrips() {
  return useQuery({
    queryKey: queryKeys.trips.lists(),
    queryFn: async () => {
      return await dataService.getTrips();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar uma viagem específica
export function useTrip(id: string) {
  return useQuery({
    queryKey: queryKeys.trips.detail(id),
    queryFn: async () => {
      const trips = await dataService.getTrips();
      return trips.find((t) => t.id === id) || null;
    },
    enabled: !!id,
  });
}

// Hook para criar viagem
export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Omit<Trip, "id">) => {
      return await dataService.saveTrip(trip);
    },
    onSuccess: () => {
      invalidateQueries.trips();
      invalidateQueries.calculations();
      toast.success("Viagem criada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao criar viagem:", error);
      toast.error("Erro ao criar viagem");
    },
  });
}

// Hook para atualizar viagem
export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Trip> }) => {
      return await storage.updateTrip(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips.detail(id) });
      invalidateQueries.trips();
      invalidateQueries.calculations();
      toast.success("Viagem atualizada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao atualizar viagem:", error);
      toast.error("Erro ao atualizar viagem");
    },
  });
}

// Hook para deletar viagem
export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await storage.deleteTrip(id);
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.trips.detail(id) });
      invalidateQueries.trips();
      invalidateQueries.calculations();
      toast.success("Viagem deletada com sucesso!");
    },
    onError: (error) => {
      logComponents.error("Erro ao deletar viagem:", error);
      toast.error("Erro ao deletar viagem");
    },
  });
}

// Hook para buscar viagens ativas/futuras
export function useActiveTrips() {
  return useQuery({
    queryKey: [...queryKeys.trips.lists(), "active"],
    queryFn: async () => {
      const trips = await dataService.getTrips();
      const now = new Date();

      return trips
        .filter((trip) => {
          if (!trip.endDate) return true;
          const endDate = new Date(trip.endDate);
          return endDate >= now;
        })
        .sort((a, b) => {
          const dateA = new Date(a.startDate || a.date || "").getTime();
          const dateB = new Date(b.startDate || b.date || "").getTime();
          return dateA - dateB;
        });
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
}

// Hook para buscar viagens passadas
export function usePastTrips() {
  return useQuery({
    queryKey: [...queryKeys.trips.lists(), "past"],
    queryFn: async () => {
      const trips = await dataService.getTrips();
      const now = new Date();

      return trips
        .filter((trip) => {
          if (!trip.endDate) return false;
          const endDate = new Date(trip.endDate);
          return endDate < now;
        })
        .sort((a, b) => {
          const dateA = new Date(a.endDate || "").getTime();
          const dateB = new Date(b.endDate || "").getTime();
          return dateB - dateA; // Mais recentes primeiro
        });
    },
    staleTime: 10 * 60 * 1000, // 10 minutos para dados históricos
  });
}

// Hook para buscar próximas viagens
export function useUpcomingTrips(daysThreshold: number = 30) {
  return useQuery({
    queryKey: [...queryKeys.trips.lists(), "upcoming", daysThreshold],
    queryFn: async () => {
      const trips = await dataService.getTrips();
      const now = new Date();
      const thresholdDate = new Date(
        now.getTime() + daysThreshold * 24 * 60 * 60 * 1000,
      );

      return trips
        .filter((trip) => {
          const startDate = new Date(trip.startDate || trip.date || "");
          return startDate >= now && startDate <= thresholdDate;
        })
        .sort((a, b) => {
          const dateA = new Date(a.startDate || a.date || "").getTime();
          const dateB = new Date(b.startDate || b.date || "").getTime();
          return dateA - dateB;
        });
    },
    staleTime: 1 * 60 * 1000, // 1 minuto para dados urgentes
  });
}

// Hook para buscar estatísticas de viagens
export function useTripsStats() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "trips-stats"],
    queryFn: async () => {
      const trips = await dataService.getTrips();

      if (trips.length === 0) {
        return {
          totalTrips: 0,
          totalBudget: 0,
          totalSpent: 0,
          averageBudget: 0,
          averageSpent: 0,
          destinationDistribution: {},
          budgetUtilization: 0,
          upcomingTrips: 0,
          pastTrips: 0,
        };
      }

      const now = new Date();
      let totalBudget = 0;
      let totalSpent = 0;
      let upcomingTrips = 0;
      let pastTrips = 0;

      const destinationDistribution = trips.reduce(
        (acc, trip) => {
          const destination = trip.destination || "Não informado";
          acc[destination] = (acc[destination] || 0) + 1;

          // Calcular orçamentos e gastos
          totalBudget += trip.budget || 0;
          totalSpent += trip.spent || 0;

          // Classificar viagens
          const endDate = trip.endDate ? new Date(trip.endDate) : null;
          if (endDate) {
            if (endDate >= now) {
              upcomingTrips++;
            } else {
              pastTrips++;
            }
          } else {
            upcomingTrips++; // Assumir que viagens sem data final são futuras
          }

          return acc;
        },
        {} as Record<string, number>,
      );

      const averageBudget = totalBudget / trips.length;
      const averageSpent = totalSpent / trips.length;
      const budgetUtilization =
        totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        totalTrips: trips.length,
        totalBudget,
        totalSpent,
        averageBudget,
        averageSpent,
        destinationDistribution,
        budgetUtilization,
        upcomingTrips,
        pastTrips,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar viagens por destino
export function useTripsByDestination() {
  return useQuery({
    queryKey: [...queryKeys.trips.lists(), "by-destination"],
    queryFn: async () => {
      const trips = await dataService.getTrips();

      const tripsByDestination = trips.reduce(
        (acc, trip) => {
          const destination = trip.destination || "Não informado";
          if (!acc[destination]) {
            acc[destination] = [];
          }
          acc[destination].push(trip);
          return acc;
        },
        {} as Record<string, Trip[]>,
      );

      return tripsByDestination;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para buscar análise de gastos de viagens
export function useTripsExpenseAnalysis() {
  return useQuery({
    queryKey: [...queryKeys.calculations.financial(), "trips-expense-analysis"],
    queryFn: async () => {
      const trips = await dataService.getTrips();

      const analysis = trips.map((trip) => {
        const budget = trip.budget || 0;
        const spent = trip.spent || 0;
        const remaining = budget - spent;
        const utilizationPercentage = budget > 0 ? (spent / budget) * 100 : 0;
        const isOverBudget = spent > budget;

        return {
          id: trip.id,
          destination: trip.destination,
          budget,
          spent,
          remaining,
          utilizationPercentage,
          isOverBudget,
          startDate: trip.startDate || trip.date,
          endDate: trip.endDate,
        };
      });

      // Estatísticas gerais
      const overBudgetTrips = analysis.filter((a) => a.isOverBudget).length;
      const averageUtilization =
        analysis.length > 0
          ? analysis.reduce((sum, a) => sum + a.utilizationPercentage, 0) /
            analysis.length
          : 0;

      const mostExpensiveTrip = analysis.reduce(
        (max, trip) => (trip.spent > max.spent ? trip : max),
        analysis[0] || null,
      );

      const mostEfficientTrip = analysis.reduce(
        (min, trip) =>
          trip.utilizationPercentage < min.utilizationPercentage ? trip : min,
        analysis[0] || null,
      );

      return {
        analysis,
        overBudgetTrips,
        averageUtilization,
        mostExpensiveTrip,
        mostEfficientTrip,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
