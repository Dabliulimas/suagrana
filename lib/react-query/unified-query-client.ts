import { QueryClient } from "@tanstack/react-query";
import { logComponents } from "../logger";
import { getSyncMiddleware } from "../middleware/sync-middleware";

// Instância única do Query Client otimizada
export const unifiedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache mais agressivo para dados financeiros
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      
      // Retry inteligente
      retry: (failureCount, error: any) => {
        // Não retry em erros de autenticação
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Máximo 3 tentativas para outros erros
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch otimizado para dados financeiros
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry para mutações críticas
      retry: (failureCount, error: any) => {
        // Não retry em erros de validação
        if (error?.status === 400 || error?.status === 422) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Inicializar middleware de sincronização
try {
  getSyncMiddleware(unifiedQueryClient);
  logComponents.info("Middleware de sincronização inicializado com sucesso");
} catch (error) {
  logComponents.error("Erro ao inicializar middleware de sincronização:", error);
}

// Chaves de query padronizadas e hierárquicas
export const unifiedQueryKeys = {
  // Transações
  transactions: {
    all: ["transactions"] as const,
    lists: () => [...unifiedQueryKeys.transactions.all, "list"] as const,
    list: (filters?: any) => [...unifiedQueryKeys.transactions.lists(), filters] as const,
    details: () => [...unifiedQueryKeys.transactions.all, "detail"] as const,
    detail: (id: string) => [...unifiedQueryKeys.transactions.details(), id] as const,
    recent: (limit?: number) => [...unifiedQueryKeys.transactions.lists(), "recent", limit] as const,
    stats: () => [...unifiedQueryKeys.transactions.all, "stats"] as const,
    byCategory: () => [...unifiedQueryKeys.transactions.all, "by-category"] as const,
  },
  // Contas
  accounts: {
    all: ["accounts"] as const,
    lists: () => [...unifiedQueryKeys.accounts.all, "list"] as const,
    list: (filters?: any) => [...unifiedQueryKeys.accounts.lists(), filters] as const,
    details: () => [...unifiedQueryKeys.accounts.all, "detail"] as const,
    detail: (id: string) => [...unifiedQueryKeys.accounts.details(), id] as const,
    summary: () => [...unifiedQueryKeys.accounts.all, "summary"] as const,
    balances: () => [...unifiedQueryKeys.accounts.all, "balances"] as const,
  },
  // Investimentos
  investments: {
    all: ["investments"] as const,
    lists: () => [...unifiedQueryKeys.investments.all, "list"] as const,
    list: (filters?: any) => [...unifiedQueryKeys.investments.lists(), filters] as const,
    details: () => [...unifiedQueryKeys.investments.all, "detail"] as const,
    detail: (id: string) => [...unifiedQueryKeys.investments.details(), id] as const,
    portfolio: () => [...unifiedQueryKeys.investments.all, "portfolio"] as const,
  },
  // Metas
  goals: {
    all: ["goals"] as const,
    lists: () => [...unifiedQueryKeys.goals.all, "list"] as const,
    list: (filters?: any) => [...unifiedQueryKeys.goals.lists(), filters] as const,
    details: () => [...unifiedQueryKeys.goals.all, "detail"] as const,
    detail: (id: string) => [...unifiedQueryKeys.goals.details(), id] as const,
    dashboard: () => [...unifiedQueryKeys.goals.all, "dashboard"] as const,
  },
  // Viagens
  trips: {
    all: ["trips"] as const,
    lists: () => [...unifiedQueryKeys.trips.all, "list"] as const,
    list: (filters?: any) => [...unifiedQueryKeys.trips.lists(), filters] as const,
    details: () => [...unifiedQueryKeys.trips.all, "detail"] as const,
    detail: (id: string) => [...unifiedQueryKeys.trips.details(), id] as const,
  },
  // Cálculos e relatórios
  calculations: {
    all: ["calculations"] as const,
    financial: () => [...unifiedQueryKeys.calculations.all, "financial"] as const,
    dashboard: (params?: any) => [...unifiedQueryKeys.calculations.financial(), "dashboard", params] as const,
    reports: (params?: any) => [...unifiedQueryKeys.calculations.financial(), "reports", params] as const,
  },
  // Relatórios
  reports: {
    all: ["reports"] as const,
    dashboard: (params?: any) => [...unifiedQueryKeys.reports.all, "dashboard", params] as const,
    balanceSheet: (date?: string) => [...unifiedQueryKeys.reports.all, "balance-sheet", date] as const,
    incomeStatement: (startDate?: string, endDate?: string) => [
      ...unifiedQueryKeys.reports.all,
      "income-statement",
      startDate,
      endDate,
    ] as const,
    cashFlow: (period?: string) => [...unifiedQueryKeys.reports.all, "cash-flow", period] as const,
  },
} as const;

// Sistema de invalidação inteligente e abrangente
export const unifiedInvalidation = {
  // Invalidação completa de transações
  transactions: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.balances() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  },

  // Invalidação completa de contas
  accounts: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  },

  // Invalidação completa de investimentos
  investments: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.investments.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  },

  // Invalidação completa de metas
  goals: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.goals.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  },

  // Invalidação completa de viagens
  trips: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.trips.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
    ]);
  },

  // Invalidação global - usar com cuidado
  allFinancialData: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.investments.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.goals.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.trips.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.all }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.all }),
    ]);
  },

  // Invalidação específica do dashboard
  dashboard: async () => {
    await Promise.all([
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.calculations.dashboard() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
      unifiedQueryClient.invalidateQueries({ queryKey: unifiedQueryKeys.goals.dashboard() }),
    ]);
  },
};

// Utilitários para refetch forçado
export const unifiedRefetch = {
  // Refetch específico de dados críticos
  criticalData: async () => {
    await Promise.all([
      unifiedQueryClient.refetchQueries({ queryKey: unifiedQueryKeys.accounts.summary() }),
      unifiedQueryClient.refetchQueries({ queryKey: unifiedQueryKeys.transactions.recent() }),
      unifiedQueryClient.refetchQueries({ queryKey: unifiedQueryKeys.reports.dashboard() }),
    ]);
  },

  // Refetch completo (usar apenas quando necessário)
  allData: async () => {
    await unifiedQueryClient.refetchQueries();
  },
};

// Função para limpar cache completamente (usar apenas em casos extremos)
export const clearAllCache = () => {
  unifiedQueryClient.clear();
};

export default unifiedQueryClient;