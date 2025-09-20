"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { UnifiedFinancialSystem } from "@/lib/unified-financial-system";

import { logComponents } from "../../lib/logger";
// Cache global otimizado com diferentes TTLs
const storageCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();
const CACHE_TTL = {
  SHORT: 5000, // 5 segundos para dados que mudam frequentemente
  MEDIUM: 30000, // 30 segundos para dados normais
  LONG: 300000, // 5 minutos para dados estáticos
};

// Debounce para operações de escrita
const writeDebounceMap = new Map<string, NodeJS.Timeout>();

// Função para limpar cache expirado
const cleanExpiredCache = () => {
  if (typeof window === "undefined") return; // Skip on server
  const now = Date.now();
  for (const [key, value] of storageCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      storageCache.delete(key);
    }
  }
};

// Função para debounce de escritas
function debounceWrite(
  key: string,
  writeFunction: () => void,
  delay: number = 500,
): void {
  const existingTimeout = writeDebounceMap.get(key);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    writeFunction();
    writeDebounceMap.delete(key);
  }, delay);

  writeDebounceMap.set(key, timeout);
}

// Limpar cache expirado a cada minuto
if (typeof window !== "undefined") {
  setInterval(cleanExpiredCache, 60000);
}

// Hook otimizado para dados do storage
export function useOptimizedStorage<T>(
  key: string,
  fetchFn: () => T,
  dependencies: any[] = [],
  ttl: number = CACHE_TTL.MEDIUM,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const writeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função memoizada para buscar dados
  const memoizedFetchFn = useCallback(fetchFn, dependencies);

  // Função para buscar dados com cache
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar cache primeiro (apenas no cliente)
      const cached = storageCache.get(key);
      if (
        cached &&
        typeof window !== "undefined" &&
        Date.now() - cached.timestamp < cached.ttl
      ) {
        setData(cached.data);
        setLoading(false);
        return cached.data;
      }

      // Buscar dados frescos
      const result = memoizedFetchFn();

      // Atualizar cache com TTL específico (apenas no cliente)
      if (typeof window !== "undefined") {
        storageCache.set(key, {
          data: result,
          timestamp: Date.now(),
          ttl: ttl,
        });
      }

      setData(result);
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Erro ao carregar dados");
      setError(error);
      logComponents.error("Erro ao carregar ${key}:", error);
    } finally {
      setLoading(false);
    }
  }, [key, memoizedFetchFn, ttl]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    storageCache.delete(key);
    fetchData();
  }, [key, fetchData]);

  // Carregar dados na inicialização
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidateCache,
  };
}

// Hook específico para transações com otimizações
// Função para normalizar formato de data para ISO (YYYY-MM-DD)
function normalizeTransactionDate(dateStr: string): string {
  if (!dateStr) return dateStr;

  // Se já está no formato ISO, retornar como está
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr;
  }

  // Se está no formato brasileiro DD/MM/YYYY ou DD/MM/YY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dateStr)) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      let year = parts[2];

      // Converter ano de 2 dígitos para 4 dígitos
      if (year.length === 2) {
        const currentYear = new Date().getFullYear();
        const currentCentury = Math.floor(currentYear / 100) * 100;
        year = String(currentCentury + parseInt(year));
      }

      return `${year}-${month}-${day}`;
    }
  }

  // Tentar parsear como Date e converter
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch (e) {
    console.warn(`Não foi possível normalizar a data: ${dateStr}`);
  }

  return dateStr; // Retornar original se não conseguir converter
}

// Função para normalizar todas as transações
function normalizeTransactions(transactions: any[]): any[] {
  if (!Array.isArray(transactions)) return transactions;

  return transactions.map((transaction) => {
    if (transaction.date) {
      const normalizedDate = normalizeTransactionDate(transaction.date);
      if (normalizedDate !== transaction.date) {
        return {
          ...transaction,
          date: normalizedDate,
          _originalDate: transaction.date,
          _dateNormalized: true,
        };
      }
    }
    return transaction;
  });
}

export function useOptimizedTransactions() {
  const computedDataRef = useRef<{ [key: string]: any }>({});
  const result = useOptimizedStorage(
    "sua-grana-transactions",
    async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      const rawTransactions = await financialSystem.getTransactions();
      // Normalizar datas automaticamente
      return normalizeTransactions(rawTransactions);
    },
    [],
    CACHE_TTL.SHORT,
  );

  // Limpar cache computado quando dados mudam
  useEffect(() => {
    computedDataRef.current = {};
  }, [result.data]);

  return {
    ...result,
    computedDataRef,
  };
}

// Hook específico para contas com otimizações
export function useOptimizedAccounts() {
  return useOptimizedStorage(
    "sua-grana-accounts",
    async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      return await financialSystem.getAccounts();
    },
    [],
  );
}

// Hook específico para investimentos com otimizações
export function useOptimizedInvestments() {
  return useOptimizedStorage(
    "sua-grana-investments",
    async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
      return await financialSystem.getInvestments();
    },
    [],
  );
}

// Hook específico para metas com otimizações
export function useOptimizedGoals() {
  return useOptimizedStorage("sua-grana-goals", async () => {
    const financialSystem = UnifiedFinancialSystem.getInstance();
    return await financialSystem.getGoals();
  }, []);
}

// Hook específico para cartões com otimizações
export function useOptimizedCards() {
  return useOptimizedStorage(
    "sua-grana-cards",
    async () => {
      const financialSystem = UnifiedFinancialSystem.getInstance();
  const accounts = await financialSystem.getAccounts();
      return accounts.filter((account) => account.type === "credit");
    },
    [],
  );
}

// Hook para dados agregados com cache inteligente
export function useOptimizedDashboardData() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const dashboardCacheRef = useRef<{ [key: string]: any }>({});

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar cache
      const cached = storageCache.get("dashboard");
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setDashboardData(cached.data);
        setLoading(false);
        return;
      }

      // Buscar todos os dados necessários de uma vez via API
      const [txRes, accRes, invRes, goalsRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/accounts"),
        fetch("/api/investments").catch(() => ({
          ok: false,
          json: async () => ({ investments: [] }),
        })),
        fetch("/api/goals").catch(() => ({
          ok: false,
          json: async () => ({ goals: [] }),
        })),
      ]);

      if (!txRes.ok || !accRes.ok)
        throw new Error("Falha ao carregar dashboard");

      const [{ transactions }, { accounts }, invData, goalsData] =
        await Promise.all([
          txRes.json(),
          accRes.json(),
          invRes.ok ? invRes.json() : { investments: [] },
          goalsRes.ok ? goalsRes.json() : { goals: [] },
        ]);

      const investments = invData?.investments || [];
      const goals = goalsData?.goals || [];

      const cacheKey = `dashboard_${transactions.length}_${accounts.length}_${investments.length}_${goals.length}`;
      if (dashboardCacheRef.current[cacheKey]) {
        setDashboardData(dashboardCacheRef.current[cacheKey]);
        setLoading(false);
        return;
      }

      const data = {
        transactions,
        accounts,
        investments,
        goals,
        summary: {
          totalBalance: (accounts || []).reduce(
            (sum: number, acc: any) => sum + (acc.balance || 0),
            0,
          ),
          totalInvestments: (investments || []).reduce(
            (sum: number, inv: any) =>
              sum + (inv.totalValue || inv.currentValue || 0),
            0,
          ),
          monthlyExpenses: (transactions || [])
            .filter(
              (t: any) =>
                (t.type === "expense" || t.type === "shared") &&
                new Date(t.date).getMonth() === new Date().getMonth(),
            )
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0),
        },
      };

      // Atualizar cache com TTL longo
      storageCache.set("dashboard", {
        data,
        timestamp: Date.now(),
        ttl: CACHE_TTL.LONG,
      });

      dashboardCacheRef.current[cacheKey] = data;
      setDashboardData(data);
    } catch (error) {
      logComponents.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data: dashboardData,
    loading,
    refetch: fetchDashboardData,
  };
}

// Hook para filtros otimizados
export function useOptimizedFilters<T>(
  data: T[],
  filterFn: (item: T, filters: any) => boolean,
  initialFilters: any = {},
) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce do termo de busca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Dados filtrados memoizados
  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      // Aplicar filtros personalizados
      const passesCustomFilter = filterFn(item, filters);

      // Aplicar busca por texto se houver
      if (debouncedSearchTerm) {
        const searchableText = JSON.stringify(item).toLowerCase();
        const passesSearch = searchableText.includes(
          debouncedSearchTerm.toLowerCase(),
        );
        return passesCustomFilter && passesSearch;
      }

      return passesCustomFilter;
    });
  }, [data, filters, debouncedSearchTerm, filterFn]);

  return {
    filteredData,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
    totalCount: data?.length || 0,
    filteredCount: filteredData.length,
  };
}

// Hook para paginação otimizada
export function useOptimizedPagination<T>(data: T[], pageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Reset para primeira página quando dados mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    totalItems: data.length,
  };
}

// Função para limpar todo o cache
export function clearStorageCache() {
  storageCache.clear();
}

// Função para pré-carregar dados importantes
export async function preloadCriticalData() {
  // Pré-carregar dados mais usados
  const criticalKeys = ["transactions", "accounts", "dashboard"];

  for (const key of criticalKeys) {
    if (!storageCache.has(key)) {
      switch (key) {
        case "transactions":
          const financialSystem1 = UnifiedFinancialSystem.getInstance();
          storageCache.set(key, {
            data: await financialSystem1.getTransactions(),
            timestamp: Date.now(),
            ttl: CACHE_TTL.MEDIUM,
          });
          break;
        case "accounts":
          const financialSystem2 = UnifiedFinancialSystem.getInstance();
          storageCache.set(key, {
            data: await financialSystem2.getAccounts(),
            timestamp: Date.now(),
            ttl: CACHE_TTL.MEDIUM,
          });
          break;
      }
    }
  }
}
