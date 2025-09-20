import { QueryClient } from "@tanstack/react-query";

// Configuração otimizada do Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 5 minutos por padrão
      staleTime: 5 * 60 * 1000,
      // Manter dados em cache por 10 minutos
      gcTime: 10 * 60 * 1000,
      // Retry automático em caso de erro
      retry: 2,
      // Refetch quando a janela ganha foco
      refetchOnWindowFocus: false,
      // Refetch quando reconecta
      refetchOnReconnect: false,
      // Não refetch automaticamente quando monta
      refetchOnMount: false,
    },
    mutations: {
      // Retry automático para mutations
      retry: 1,
    },
  },
});

// Chaves de query padronizadas
export const queryKeys = {
  // Transações
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...queryKeys.transactions.all, "list"] as const,
    list: (filters?: any) =>
      [...queryKeys.transactions.lists(), filters] as const,
    details: () => [...queryKeys.transactions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.transactions.details(), id] as const,
  },
  // Contas
  accounts: {
    all: ["accounts"] as const,
    lists: () => [...queryKeys.accounts.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.accounts.lists(), filters] as const,
    details: () => [...queryKeys.accounts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
  },
  // Investimentos
  investments: {
    all: ["investments"] as const,
    lists: () => [...queryKeys.investments.all, "list"] as const,
    list: (filters?: any) =>
      [...queryKeys.investments.lists(), filters] as const,
    details: () => [...queryKeys.investments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.investments.details(), id] as const,
  },
  // Metas
  goals: {
    all: ["goals"] as const,
    lists: () => [...queryKeys.goals.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.goals.lists(), filters] as const,
    details: () => [...queryKeys.goals.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.goals.details(), id] as const,
  },
  // Viagens
  trips: {
    all: ["trips"] as const,
    lists: () => [...queryKeys.trips.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.trips.lists(), filters] as const,
    details: () => [...queryKeys.trips.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.trips.details(), id] as const,
  },
  // Cálculos financeiros
  calculations: {
    all: ["calculations"] as const,
    financial: () => [...queryKeys.calculations.all, "financial"] as const,
    dashboard: (params?: any) =>
      [...queryKeys.calculations.financial(), "dashboard", params] as const,
    reports: (params?: any) =>
      [...queryKeys.calculations.financial(), "reports", params] as const,
  },
  // Relatórios
  reports: {
    all: ["reports"] as const,
    dashboard: (params?: any) =>
      [...queryKeys.reports.all, "dashboard", params] as const,
    balanceSheet: (date?: string) =>
      [...queryKeys.reports.all, "balance-sheet", date] as const,
    incomeStatement: (startDate?: string, endDate?: string) =>
      [
        ...queryKeys.reports.all,
        "income-statement",
        startDate,
        endDate,
      ] as const,
    cashFlow: (period?: string) =>
      [...queryKeys.reports.all, "cash-flow", period] as const,
  },
} as const;

// Utilitários para invalidação de cache
export const invalidateQueries = {
  // Invalidar todas as transações
  transactions: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
  // Invalidar todas as contas
  accounts: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all }),
  // Invalidar todos os investimentos
  investments: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.investments.all }),
  // Invalidar todas as metas
  goals: () => queryClient.invalidateQueries({ queryKey: queryKeys.goals.all }),
  // Invalidar todas as viagens
  trips: () => queryClient.invalidateQueries({ queryKey: queryKeys.trips.all }),
  // Invalidar todos os cálculos
  calculations: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.calculations.all }),
  // Invalidar todos os relatórios
  reports: () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all }),
  // Invalidar tudo relacionado a dados financeiros
  allFinancial: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.trips.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.calculations.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
  },
};
