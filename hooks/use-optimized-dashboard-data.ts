import { useState, useEffect, useCallback, useMemo } from "react";
import { logComponents } from "../../lib/logger";
import type { Transaction, Account, Investment, Goal, Trip } from "../types";
import { financialCache } from "../lib/optimization/smart-cache";

interface DashboardData {
  transactions: Transaction[];
  accounts: Account[];
  investments: Investment[];
  goals: Goal[];
  trips: Trip[];
}

interface LoadingState {
  transactions: boolean;
  accounts: boolean;
  investments: boolean;
  goals: boolean;
  trips: boolean;
}

interface OptimizedDashboardData extends DashboardData {
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOptimizedDashboardData(): OptimizedDashboardData {
  const [data, setData] = useState<DashboardData>({
    transactions: [],
    accounts: [],
    investments: [],
    goals: [],
    trips: [],
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    transactions: true,
    accounts: true,
    investments: true,
    goals: true,
    trips: true,
  });

  const [error, setError] = useState<string | null>(null);

  // Função otimizada para carregar dados críticos primeiro
  const loadCriticalData = useCallback(async () => {
    try {
      // Verificar cache primeiro com timestamp
      const cacheKey = "critical_data";
      const cached = financialCache.get<{
        transactions: Transaction[];
        accounts: Account[];
        timestamp: number;
      }>(cacheKey);

      // Cache válido por 30 segundos
      if (cached && Date.now() - cached.timestamp < 30000) {
        setData((prev) => ({
          ...prev,
          transactions: cached.transactions,
          accounts: cached.accounts,
        }));
        setLoadingState((prev) => ({
          ...prev,
          transactions: false,
          accounts: false,
        }));
        return;
      }

      // Buscar do backend
      const [txRes, accRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/accounts"),
      ]);
      if (!txRes.ok || !accRes.ok)
        throw new Error("Falha ao carregar dados críticos");
      const [{ transactions }, { accounts }] = await Promise.all([
        txRes.json(),
        accRes.json(),
      ]);

      // Cache com timestamp
      financialCache.set(cacheKey, {
        transactions,
        accounts,
        timestamp: Date.now(),
      });

      setData((prev) => ({
        ...prev,
        transactions,
        accounts,
      }));

      setLoadingState((prev) => ({
        ...prev,
        transactions: false,
        accounts: false,
      }));
    } catch (err) {
      logComponents.error("Error loading critical data:", err);
      setError("Erro ao carregar dados críticos");
      setLoadingState((prev) => ({
        ...prev,
        transactions: false,
        accounts: false,
      }));
    }
  }, []);

  // Função otimizada para carregar dados não críticos
  const loadNonCriticalData = useCallback(async () => {
    try {
      // Verificar cache com timestamp
      const cacheKey = "non_critical_data";
      const cached = financialCache.get<{
        investments: Investment[];
        goals: Goal[];
        trips: Trip[];
        timestamp: number;
      }>(cacheKey);

      // Cache válido por 60 segundos para dados menos críticos
      if (cached && Date.now() - cached.timestamp < 60000) {
        setData((prev) => ({
          ...prev,
          investments: cached.investments,
          goals: cached.goals,
          trips: cached.trips,
        }));
        setLoadingState((prev) => ({
          ...prev,
          investments: false,
          goals: false,
          trips: false,
        }));
        return;
      }

      // Buscar dados não críticos
      const [invRes, goalsRes, tripsRes] = await Promise.all([
        fetch("/api/investments").catch(() => ({
          ok: false,
          json: async () => ({ investments: [] }),
        })),
        fetch("/api/goals").catch(() => ({
          ok: false,
          json: async () => ({ goals: [] }),
        })),
        fetch("/api/trips").catch(() => ({
          ok: false,
          json: async () => ({ trips: [] }),
        })),
      ]);
      const [invData, goalsData, tripsData] = await Promise.all([
        invRes.ok ? invRes.json() : { investments: [] },
        goalsRes.ok ? goalsRes.json() : { goals: [] },
        tripsRes.ok ? tripsRes.json() : { trips: [] },
      ]);
      const investments = invData.investments || [];
      const goals = goalsData.goals || [];
      const trips = tripsData.trips || [];

      financialCache.set(cacheKey, {
        investments,
        goals,
        trips,
        timestamp: Date.now(),
      });
      setData((prev) => ({ ...prev, investments, goals, trips }));
      setLoadingState((prev) => ({
        ...prev,
        investments: false,
        goals: false,
        trips: false,
      }));
    } catch (err) {
      logComponents.error("Error loading non-critical data:", err);
      setLoadingState((prev) => ({
        ...prev,
        investments: false,
        goals: false,
        trips: false,
      }));
    }
  }, []);

  // Função para atualizar todos os dados
  const refresh = useCallback(async () => {
    // Limpar cache
    financialCache.clear();

    // Resetar estado de loading
    setLoadingState({
      transactions: true,
      accounts: true,
      investments: true,
      goals: true,
      trips: true,
    });

    setError(null);

    // Carregar dados críticos primeiro
    await loadCriticalData();

    // Carregar dados não críticos em background
    loadNonCriticalData();
  }, [loadCriticalData, loadNonCriticalData]);

  // Carregar dados na inicialização
  useEffect(() => {
    // Carregar dados críticos imediatamente
    loadCriticalData();

    // Carregar dados não críticos após um pequeno delay
    const timer = setTimeout(() => {
      loadNonCriticalData();
    }, 200);

    return () => clearTimeout(timer);
  }, [loadCriticalData, loadNonCriticalData]);

  // Calcular se ainda está carregando
  const isLoading = useMemo(() => {
    return Object.values(loadingState).some((loading) => loading);
  }, [loadingState]);

  return {
    ...data,
    isLoading,
    loadingState,
    error,
    refresh,
  };
}
