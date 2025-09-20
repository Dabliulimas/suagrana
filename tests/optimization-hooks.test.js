/**
 * Testes para hooks de otimização
 * Testa useOptimizedFinancialCalculations, useOptimizedMemo e useOptimizedCallback
 */

import { renderHook, act } from "@testing-library/react";
import { useOptimizedFinancialCalculations } from "@/hooks/use-optimized-financial-calculations";
import {
  useOptimizedMemo,
  useOptimizedCallback,
} from "@/lib/performance-optimizer";
import { calculationCache } from "@/lib/optimization/smart-cache";
import { financialCalculationOptimizer } from "@/lib/performance-optimizer";

// Mock das dependências
jest.mock("@/lib/optimization/smart-cache");
jest.mock("@/lib/performance-optimizer");

// Dados de teste
const mockTransactions = [
  {
    id: "1",
    amount: -150.5,
    description: "Supermercado",
    category: "alimentacao",
    date: "2024-01-15T10:30:00.000Z",
    type: "expense",
    accountId: "acc1",
    updatedAt: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "2",
    amount: 3000.0,
    description: "Salário",
    category: "salario",
    date: "2024-01-01T09:00:00.000Z",
    type: "income",
    accountId: "acc1",
    updatedAt: "2024-01-01T09:00:00.000Z",
  },
];

const mockGoals = [
  {
    id: "1",
    name: "Viagem Europa",
    targetAmount: 10000,
    currentAmount: 2500,
    deadline: "2024-12-31",
    category: "viagem",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
];

const mockAccounts = [
  {
    id: "acc1",
    name: "Conta Corrente",
    balance: 2849.5,
    type: "checking",
    updatedAt: "2024-01-15T10:30:00.000Z",
  },
];

const mockInvestments = [];
const mockTrips = [];

describe("Hooks de Otimização", () => {
  let mockCalculationCache;
  let mockFinancialCalculationOptimizer;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do cache
    mockCalculationCache = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
    };
    calculationCache.get = mockCalculationCache.get;
    calculationCache.set = mockCalculationCache.set;
    calculationCache.clear = mockCalculationCache.clear;
    calculationCache.delete = mockCalculationCache.delete;
    calculationCache.has = mockCalculationCache.has;

    // Mock do otimizador
    mockFinancialCalculationOptimizer = {
      optimizeCalculation: jest.fn(),
      clearCache: jest.fn(),
    };
    financialCalculationOptimizer.optimizeCalculation =
      mockFinancialCalculationOptimizer.optimizeCalculation;
    financialCalculationOptimizer.clearCache =
      mockFinancialCalculationOptimizer.clearCache;
  });

  describe("useOptimizedFinancialCalculations", () => {
    test("deve calcular métricas financeiras básicas", () => {
      const { result } = renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      expect(result.current).toHaveProperty("totalIncome");
      expect(result.current).toHaveProperty("totalExpenses");
      expect(result.current).toHaveProperty("netIncome");
      expect(result.current).toHaveProperty("categoryBreakdown");
      expect(result.current).toHaveProperty("trends");
      expect(result.current).toHaveProperty("goalProgress");
    });

    test("deve calcular receitas e despesas corretamente", () => {
      const { result } = renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      expect(result.current.totalIncome).toBe(3000.0);
      expect(result.current.totalExpenses).toBe(150.5);
      expect(result.current.netIncome).toBe(2849.5);
    });

    test("deve gerar breakdown por categoria", () => {
      const { result } = renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      expect(result.current.categoryBreakdown).toEqual({
        alimentacao: 150.5,
        salario: 3000.0,
      });
    });

    test("deve usar cache quando dados não mudam", () => {
      const cacheKey = expect.any(String);
      const cachedResult = {
        totalIncome: 3000.0,
        totalExpenses: 150.5,
        netIncome: 2849.5,
      };

      mockCalculationCache.get.mockReturnValue(cachedResult);

      const { result, rerender } = renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      // Primeira renderização
      expect(result.current.totalIncome).toBe(3000.0);

      // Segunda renderização com os mesmos dados
      rerender();

      // Deve usar cache
      expect(mockCalculationCache.get).toHaveBeenCalled();
    });

    test("deve recalcular quando dados mudam", () => {
      const { result, rerender } = renderHook(
        ({ transactions }) =>
          useOptimizedFinancialCalculations(
            transactions,
            mockGoals,
            mockInvestments,
            mockAccounts,
            mockTrips,
          ),
        {
          initialProps: { transactions: mockTransactions },
        },
      );

      const initialIncome = result.current.totalIncome;

      // Adiciona nova transação
      const newTransactions = [
        ...mockTransactions,
        {
          id: "3",
          amount: 500.0,
          description: "Freelance",
          category: "trabalho",
          date: "2024-01-16T14:00:00.000Z",
          type: "income",
          accountId: "acc1",
          updatedAt: "2024-01-16T14:00:00.000Z",
        },
      ];

      rerender({ transactions: newTransactions });

      expect(result.current.totalIncome).toBe(3500.0);
      expect(result.current.totalIncome).not.toBe(initialIncome);
    });

    test("deve gerar chave de cache baseada no conteúdo", () => {
      renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      // Verifica se a chave de cache foi gerada corretamente
      expect(mockCalculationCache.get).toHaveBeenCalledWith(
        expect.stringMatching(/^financial_calc_/),
      );
    });

    test("deve lidar com arrays vazios", () => {
      const { result } = renderHook(() =>
        useOptimizedFinancialCalculations([], [], [], [], []),
      );

      expect(result.current.totalIncome).toBe(0);
      expect(result.current.totalExpenses).toBe(0);
      expect(result.current.netIncome).toBe(0);
      expect(result.current.categoryBreakdown).toEqual({});
    });

    test("deve calcular progresso das metas", () => {
      const { result } = renderHook(() =>
        useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        ),
      );

      expect(result.current.goalProgress).toEqual({
        totalGoals: 1,
        completedGoals: 0,
        averageProgress: 25, // 2500/10000 * 100
      });
    });
  });

  describe("useOptimizedMemo", () => {
    test("deve memorizar resultado de função cara", () => {
      const expensiveFunction = jest.fn((a, b) => a + b);

      const { result, rerender } = renderHook(
        ({ a, b }) => useOptimizedMemo(() => expensiveFunction(a, b), [a, b]),
        { initialProps: { a: 1, b: 2 } },
      );

      expect(result.current).toBe(3);
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Rerenderiza com os mesmos valores
      rerender({ a: 1, b: 2 });
      expect(expensiveFunction).toHaveBeenCalledTimes(1); // Não deve recalcular

      // Rerenderiza com valores diferentes
      rerender({ a: 2, b: 3 });
      expect(result.current).toBe(5);
      expect(expensiveFunction).toHaveBeenCalledTimes(2);
    });

    test("deve usar cache personalizado quando fornecido", () => {
      const customCache = {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn().mockReturnValue(false),
      };

      const expensiveFunction = jest.fn(() => "result");

      renderHook(() =>
        useOptimizedMemo(expensiveFunction, [], { cache: customCache }),
      );

      expect(customCache.get).toHaveBeenCalled();
      expect(customCache.set).toHaveBeenCalled();
    });

    test("deve respeitar TTL do cache", () => {
      const expensiveFunction = jest.fn(() => "result");

      const { rerender } = renderHook(() =>
        useOptimizedMemo(expensiveFunction, [], { ttl: 100 }),
      );

      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Simula passagem do tempo
      jest.advanceTimersByTime(150);

      rerender();
      expect(expensiveFunction).toHaveBeenCalledTimes(2); // Deve recalcular após TTL
    });
  });

  describe("useOptimizedCallback", () => {
    test("deve memorizar callback", () => {
      const callback = jest.fn();

      const { result, rerender } = renderHook(
        ({ dep }) => useOptimizedCallback(callback, [dep]),
        { initialProps: { dep: "value1" } },
      );

      const memoizedCallback1 = result.current;

      // Rerenderiza com a mesma dependência
      rerender({ dep: "value1" });
      expect(result.current).toBe(memoizedCallback1); // Mesma referência

      // Rerenderiza com dependência diferente
      rerender({ dep: "value2" });
      expect(result.current).not.toBe(memoizedCallback1); // Nova referência
    });

    test("deve executar callback memorizado corretamente", () => {
      const callback = jest.fn((x) => x * 2);

      const { result } = renderHook(() => useOptimizedCallback(callback, []));

      const memoizedCallback = result.current;
      const resultValue = memoizedCallback(5);

      expect(resultValue).toBe(10);
      expect(callback).toHaveBeenCalledWith(5);
    });

    test("deve usar cache personalizado", () => {
      const customCache = {
        get: jest.fn(),
        set: jest.fn(),
        has: jest.fn().mockReturnValue(false),
      };

      const callback = jest.fn();

      renderHook(() =>
        useOptimizedCallback(callback, [], { cache: customCache }),
      );

      expect(customCache.get).toHaveBeenCalled();
      expect(customCache.set).toHaveBeenCalled();
    });

    test("deve invalidar cache quando dependências mudam", () => {
      const callback = jest.fn();

      const { result, rerender } = renderHook(
        ({ count }) => useOptimizedCallback(() => callback(count), [count]),
        { initialProps: { count: 1 } },
      );

      const callback1 = result.current;

      rerender({ count: 2 });
      const callback2 = result.current;

      expect(callback1).not.toBe(callback2);
    });
  });

  describe("Integração entre Hooks", () => {
    test("deve funcionar corretamente quando usados juntos", () => {
      const { result } = renderHook(() => {
        const calculations = useOptimizedFinancialCalculations(
          mockTransactions,
          mockGoals,
          mockInvestments,
          mockAccounts,
          mockTrips,
        );

        const memoizedTotal = useOptimizedMemo(
          () => calculations.totalIncome + calculations.totalExpenses,
          [calculations.totalIncome, calculations.totalExpenses],
        );

        const memoizedCallback = useOptimizedCallback(
          () => console.log("Total:", memoizedTotal),
          [memoizedTotal],
        );

        return { calculations, memoizedTotal, memoizedCallback };
      });

      expect(result.current.calculations.totalIncome).toBe(3000.0);
      expect(result.current.memoizedTotal).toBe(3150.5);
      expect(typeof result.current.memoizedCallback).toBe("function");
    });
  });
});
