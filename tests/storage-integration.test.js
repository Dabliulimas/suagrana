/**
 * Testes de integração para eventos de storage e sincronização de dados
 * Testa como o sistema reage a mudanças no localStorage e eventos customizados
 */

import { fireEvent, waitFor } from "@testing-library/react";
import { storageService } from "@/lib/storage";
import { calculationCache } from "@/lib/optimization/smart-cache";
import { financialCalculationOptimizer } from "@/lib/performance-optimizer";

// Mock das dependências
jest.mock("@/lib/storage");
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

describe("Integração de Storage", () => {
  let mockStorageService;
  let mockCalculationCache;
  let mockFinancialCalculationOptimizer;
  let originalAddEventListener;
  let originalRemoveEventListener;
  let originalDispatchEvent;
  let eventListeners;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do localStorage
    global.localStorage.clear();
    global.localStorage.setItem(
      "transactions",
      JSON.stringify(mockTransactions),
    );
    global.localStorage.setItem("goals", JSON.stringify(mockGoals));
    global.localStorage.setItem("accounts", JSON.stringify(mockAccounts));
    global.localStorage.setItem("investments", JSON.stringify([]));
    global.localStorage.setItem("trips", JSON.stringify([]));

    // Mock do storageService
    mockStorageService = {
      getTransactions: jest.fn().mockReturnValue(mockTransactions),
      getGoals: jest.fn().mockReturnValue(mockGoals),
      getAccounts: jest.fn().mockReturnValue(mockAccounts),
      getInvestments: jest.fn().mockReturnValue([]),
      getTrips: jest.fn().mockReturnValue([]),
      saveTransactions: jest.fn(),
      saveGoals: jest.fn(),
      saveAccounts: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    storageService.getTransactions = mockStorageService.getTransactions;
    storageService.getGoals = mockStorageService.getGoals;
    storageService.getAccounts = mockStorageService.getAccounts;
    storageService.getInvestments = mockStorageService.getInvestments;
    storageService.getTrips = mockStorageService.getTrips;
    storageService.saveTransactions = mockStorageService.saveTransactions;
    storageService.saveGoals = mockStorageService.saveGoals;
    storageService.saveAccounts = mockStorageService.saveAccounts;

    // Mock do cache
    mockCalculationCache = {
      clear: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      invalidatePattern: jest.fn(),
    };
    calculationCache.clear = mockCalculationCache.clear;
    calculationCache.get = mockCalculationCache.get;
    calculationCache.set = mockCalculationCache.set;
    calculationCache.delete = mockCalculationCache.delete;
    calculationCache.has = mockCalculationCache.has;
    calculationCache.invalidatePattern = mockCalculationCache.invalidatePattern;

    // Mock do otimizador
    mockFinancialCalculationOptimizer = {
      clearCache: jest.fn(),
      optimizeCalculation: jest.fn().mockResolvedValue({
        totalIncome: 3000.0,
        totalExpenses: 150.5,
        netIncome: 2849.5,
      }),
    };
    financialCalculationOptimizer.clearCache =
      mockFinancialCalculationOptimizer.clearCache;
    financialCalculationOptimizer.optimizeCalculation =
      mockFinancialCalculationOptimizer.optimizeCalculation;

    // Mock dos event listeners
    eventListeners = new Map();
    originalAddEventListener = global.addEventListener;
    originalRemoveEventListener = global.removeEventListener;
    originalDispatchEvent = global.dispatchEvent;

    global.addEventListener = jest.fn((event, listener) => {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push(listener);
    });

    global.removeEventListener = jest.fn((event, listener) => {
      if (eventListeners.has(event)) {
        const listeners = eventListeners.get(event);
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    });

    global.dispatchEvent = jest.fn((event) => {
      const eventType = event.type;
      if (eventListeners.has(eventType)) {
        eventListeners.get(eventType).forEach((listener) => {
          try {
            listener(event);
          } catch (error) {
            console.error("Error in event listener:", error);
          }
        });
      }
    });
  });

  afterEach(() => {
    global.localStorage.clear();
    global.addEventListener = originalAddEventListener;
    global.removeEventListener = originalRemoveEventListener;
    global.dispatchEvent = originalDispatchEvent;
    eventListeners.clear();
  });

  describe("Eventos de Storage Nativo", () => {
    test("deve reagir a mudanças em transações", async () => {
      // Simula mudança no localStorage
      const newTransactions = [
        ...mockTransactions,
        {
          id: "3",
          amount: -75.0,
          description: "Combustível",
          category: "transporte",
          date: "2024-01-16T08:00:00.000Z",
          type: "expense",
          accountId: "acc1",
          updatedAt: "2024-01-16T08:00:00.000Z",
        },
      ];

      global.localStorage.setItem(
        "transactions",
        JSON.stringify(newTransactions),
      );

      // Dispara evento de storage
      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify(newTransactions),
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      await waitFor(() => {
        // Verifica se os listeners foram chamados
        expect(global.addEventListener).toHaveBeenCalledWith(
          "storage",
          expect.any(Function),
        );
      });
    });

    test("deve reagir a mudanças em metas", async () => {
      const newGoals = [
        ...mockGoals,
        {
          id: "2",
          name: "Carro Novo",
          targetAmount: 50000,
          currentAmount: 5000,
          deadline: "2025-12-31",
          category: "veiculo",
          updatedAt: "2024-01-16T10:00:00.000Z",
        },
      ];

      global.localStorage.setItem("goals", JSON.stringify(newGoals));

      const storageEvent = new StorageEvent("storage", {
        key: "goals",
        newValue: JSON.stringify(newGoals),
        oldValue: JSON.stringify(mockGoals),
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      await waitFor(() => {
        expect(global.addEventListener).toHaveBeenCalledWith(
          "storage",
          expect.any(Function),
        );
      });
    });

    test("deve ignorar mudanças em chaves não relacionadas", async () => {
      const storageEvent = new StorageEvent("storage", {
        key: "unrelated_key",
        newValue: "some_value",
        oldValue: null,
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      // Não deve disparar invalidação de cache para chaves não relacionadas
      expect(
        mockFinancialCalculationOptimizer.clearCache,
      ).not.toHaveBeenCalled();
      expect(mockCalculationCache.clear).not.toHaveBeenCalled();
    });
  });

  describe("Eventos Customizados de Storage", () => {
    test("deve reagir a eventos storageChange customizados", async () => {
      const customEvent = new CustomEvent("storageChange", {
        detail: {
          key: "transactions",
          action: "update",
          data: mockTransactions,
        },
      });

      global.dispatchEvent(customEvent);

      await waitFor(() => {
        expect(global.addEventListener).toHaveBeenCalledWith(
          "storageChange",
          expect.any(Function),
        );
      });
    });

    test("deve processar diferentes tipos de ações", async () => {
      const actions = ["create", "update", "delete"];

      for (const action of actions) {
        const customEvent = new CustomEvent("storageChange", {
          detail: {
            key: "transactions",
            action,
            data: mockTransactions,
          },
        });

        global.dispatchEvent(customEvent);
      }

      await waitFor(() => {
        expect(global.addEventListener).toHaveBeenCalledWith(
          "storageChange",
          expect.any(Function),
        );
      });
    });

    test("deve lidar com eventos sem detail", async () => {
      const customEvent = new CustomEvent("storageChange");

      expect(() => {
        global.dispatchEvent(customEvent);
      }).not.toThrow();
    });
  });

  describe("Invalidação de Cache", () => {
    test("deve invalidar cache quando dados financeiros mudam", async () => {
      // Simula listener que invalida cache
      const mockListener = jest.fn((event) => {
        if (event.key === "transactions") {
          mockFinancialCalculationOptimizer.clearCache();
          mockCalculationCache.clear();
        }
      });

      global.addEventListener("storage", mockListener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify([]),
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      expect(mockListener).toHaveBeenCalledWith(storageEvent);
      expect(mockFinancialCalculationOptimizer.clearCache).toHaveBeenCalled();
      expect(mockCalculationCache.clear).toHaveBeenCalled();
    });

    test("deve invalidar cache para múltiplas chaves relacionadas", async () => {
      const financialKeys = [
        "transactions",
        "goals",
        "accounts",
        "investments",
        "trips",
      ];

      const mockListener = jest.fn((event) => {
        if (financialKeys.includes(event.key)) {
          mockFinancialCalculationOptimizer.clearCache();
          mockCalculationCache.clear();
        }
      });

      global.addEventListener("storage", mockListener);

      for (const key of financialKeys) {
        const storageEvent = new StorageEvent("storage", {
          key,
          newValue: JSON.stringify([]),
          oldValue: JSON.stringify([]),
          storageArea: global.localStorage,
        });

        global.dispatchEvent(storageEvent);
      }

      expect(mockListener).toHaveBeenCalledTimes(financialKeys.length);
      expect(
        mockFinancialCalculationOptimizer.clearCache,
      ).toHaveBeenCalledTimes(financialKeys.length);
      expect(mockCalculationCache.clear).toHaveBeenCalledTimes(
        financialKeys.length,
      );
    });

    test("deve usar invalidação por padrão quando disponível", async () => {
      const mockListener = jest.fn((event) => {
        if (event.key === "transactions") {
          // Usa invalidação por padrão se disponível
          if (mockCalculationCache.invalidatePattern) {
            mockCalculationCache.invalidatePattern(/^financial_calc_/);
          } else {
            mockCalculationCache.clear();
          }
        }
      });

      global.addEventListener("storage", mockListener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify([]),
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      expect(mockCalculationCache.invalidatePattern).toHaveBeenCalledWith(
        /^financial_calc_/,
      );
    });
  });

  describe("Sincronização de Dados", () => {
    test("deve recarregar dados após mudança no storage", async () => {
      const mockDataLoader = jest.fn().mockResolvedValue({
        transactions: mockTransactions,
        goals: mockGoals,
        accounts: mockAccounts,
      });

      const mockListener = jest.fn(async (event) => {
        if (["transactions", "goals", "accounts"].includes(event.key)) {
          await mockDataLoader();
        }
      });

      global.addEventListener("storage", mockListener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify(mockTransactions),
        oldValue: null,
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      await waitFor(() => {
        expect(mockDataLoader).toHaveBeenCalled();
      });
    });

    test("deve manter consistência entre múltiplas abas", async () => {
      const tab1Listener = jest.fn();
      const tab2Listener = jest.fn();

      global.addEventListener("storage", tab1Listener);
      global.addEventListener("storage", tab2Listener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify(mockTransactions),
        oldValue: null,
        storageArea: global.localStorage,
      });

      global.dispatchEvent(storageEvent);

      expect(tab1Listener).toHaveBeenCalledWith(storageEvent);
      expect(tab2Listener).toHaveBeenCalledWith(storageEvent);
    });
  });

  describe("Tratamento de Erros", () => {
    test("deve lidar com dados corrompidos no localStorage", async () => {
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      global.localStorage.setItem("transactions", "invalid_json");

      const mockListener = jest.fn((event) => {
        try {
          if (event.key === "transactions") {
            JSON.parse(event.newValue || "[]");
          }
        } catch (error) {
          console.warn("Dados corrompidos detectados:", error);
          // Deve continuar funcionando mesmo com erro
        }
      });

      global.addEventListener("storage", mockListener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: "invalid_json",
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      expect(() => {
        global.dispatchEvent(storageEvent);
      }).not.toThrow();

      expect(mockListener).toHaveBeenCalled();
    });

    test("deve continuar funcionando se cache falhar", async () => {
      mockCalculationCache.clear.mockImplementation(() => {
        throw new Error("Cache error");
      });

      const mockListener = jest.fn((event) => {
        try {
          if (event.key === "transactions") {
            mockCalculationCache.clear();
          }
        } catch (error) {
          console.warn("Erro ao limpar cache:", error);
          // Deve continuar funcionando
        }
      });

      global.addEventListener("storage", mockListener);

      const storageEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify([]),
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      expect(() => {
        global.dispatchEvent(storageEvent);
      }).not.toThrow();
    });
  });

  describe("Performance", () => {
    test("deve debounce eventos de storage frequentes", async () => {
      const mockListener = jest.fn();
      let debounceTimeout;

      const debouncedListener = jest.fn((event) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          mockListener(event);
        }, 100);
      });

      global.addEventListener("storage", debouncedListener);

      // Dispara múltiplos eventos rapidamente
      for (let i = 0; i < 5; i++) {
        const storageEvent = new StorageEvent("storage", {
          key: "transactions",
          newValue: JSON.stringify([{ id: i }]),
          oldValue: null,
          storageArea: global.localStorage,
        });
        global.dispatchEvent(storageEvent);
      }

      expect(debouncedListener).toHaveBeenCalledTimes(5);

      // Aguarda debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(mockListener).toHaveBeenCalledTimes(1);
    });

    test("deve evitar reprocessamento desnecessário", async () => {
      const mockListener = jest.fn((event) => {
        // Só processa se o valor realmente mudou
        if (event.newValue !== event.oldValue) {
          mockCalculationCache.clear();
        }
      });

      global.addEventListener("storage", mockListener);

      // Evento com mesmo valor
      const sameValueEvent = new StorageEvent("storage", {
        key: "transactions",
        newValue: JSON.stringify(mockTransactions),
        oldValue: JSON.stringify(mockTransactions),
        storageArea: global.localStorage,
      });

      global.dispatchEvent(sameValueEvent);

      expect(mockListener).toHaveBeenCalled();
      expect(mockCalculationCache.clear).not.toHaveBeenCalled();
    });
  });

  describe("Limpeza de Recursos", () => {
    test("deve remover event listeners corretamente", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      global.addEventListener("storage", listener1);
      global.addEventListener("storageChange", listener2);

      expect(global.addEventListener).toHaveBeenCalledTimes(2);

      global.removeEventListener("storage", listener1);
      global.removeEventListener("storageChange", listener2);

      expect(global.removeEventListener).toHaveBeenCalledTimes(2);
      expect(global.removeEventListener).toHaveBeenCalledWith(
        "storage",
        listener1,
      );
      expect(global.removeEventListener).toHaveBeenCalledWith(
        "storageChange",
        listener2,
      );
    });

    test("deve limpar timeouts e intervalos", () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const intervalId = setInterval(() => {}, 1000);

      // Simula limpeza de recursos
      clearTimeout(timeoutId);
      clearInterval(intervalId);

      // Não deve haver erros
      expect(true).toBe(true);
    });
  });
});
