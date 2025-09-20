/**
 * Testes para sistema de cache
 * Testa SmartCache e FinancialCalculationOptimizer
 */

import { SmartCache } from "../lib/optimization/smart-cache";
import { FinancialCalculationOptimizer } from "../lib/performance-optimizer";

// Mock do console para evitar logs durante testes
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

describe("Sistema de Cache", () => {
  describe("SmartCache", () => {
    let cache;

    beforeEach(() => {
      cache = new SmartCache({
        maxSize: 100,
        ttl: 5000, // 5 segundos
        cleanupInterval: 1000, // 1 segundo
      });
    });

    afterEach(() => {
      if (cache && typeof cache.destroy === "function") {
        cache.destroy();
      }
    });

    describe("Operações Básicas", () => {
      test("deve armazenar e recuperar valores", () => {
        const key = "test-key";
        const value = { data: "test-value" };

        cache.set(key, value);
        const retrieved = cache.get(key);

        expect(retrieved).toEqual(value);
      });

      test("deve retornar undefined para chaves inexistentes", () => {
        const result = cache.get("non-existent-key");
        expect(result).toBeUndefined();
      });

      test("deve verificar existência de chaves", () => {
        const key = "test-key";
        const value = "test-value";

        expect(cache.has(key)).toBe(false);

        cache.set(key, value);
        expect(cache.has(key)).toBe(true);
      });

      test("deve deletar chaves específicas", () => {
        const key = "test-key";
        const value = "test-value";

        cache.set(key, value);
        expect(cache.has(key)).toBe(true);

        const deleted = cache.delete(key);
        expect(deleted).toBe(true);
        expect(cache.has(key)).toBe(false);
      });

      test("deve limpar todo o cache", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.set("key3", "value3");

        expect(cache.size()).toBe(3);

        cache.clear();
        expect(cache.size()).toBe(0);
        expect(cache.has("key1")).toBe(false);
      });
    });

    describe("TTL (Time To Live)", () => {
      test("deve expirar entradas após TTL", (done) => {
        const shortTtlCache = new SmartCache({ ttl: 100 }); // 100ms
        const key = "expiring-key";
        const value = "expiring-value";

        shortTtlCache.set(key, value);
        expect(shortTtlCache.get(key)).toBe(value);

        setTimeout(() => {
          expect(shortTtlCache.get(key)).toBeUndefined();
          shortTtlCache.destroy();
          done();
        }, 150);
      });

      test("deve permitir TTL customizado por entrada", (done) => {
        const key = "custom-ttl-key";
        const value = "custom-ttl-value";

        cache.set(key, value, { ttl: 100 }); // 100ms TTL customizado
        expect(cache.get(key)).toBe(value);

        setTimeout(() => {
          expect(cache.get(key)).toBeUndefined();
          done();
        }, 150);
      });

      test("deve atualizar timestamp de acesso", () => {
        const key = "access-key";
        const value = "access-value";

        cache.set(key, value);
        const firstAccess = cache.get(key);

        // Simula passagem de tempo
        jest.advanceTimersByTime(1000);

        const secondAccess = cache.get(key);
        expect(secondAccess).toBe(firstAccess);
      });
    });

    describe("Gerenciamento de Tamanho", () => {
      test("deve respeitar tamanho máximo", () => {
        const smallCache = new SmartCache({ maxSize: 3 });

        smallCache.set("key1", "value1");
        smallCache.set("key2", "value2");
        smallCache.set("key3", "value3");
        expect(smallCache.size()).toBe(3);

        // Adiciona quarta entrada, deve remover a mais antiga
        smallCache.set("key4", "value4");
        expect(smallCache.size()).toBe(3);
        expect(smallCache.has("key1")).toBe(false); // Mais antiga removida
        expect(smallCache.has("key4")).toBe(true); // Nova entrada presente

        smallCache.destroy();
      });

      test("deve usar estratégia LRU para remoção", () => {
        const smallCache = new SmartCache({ maxSize: 2 });

        smallCache.set("key1", "value1");
        smallCache.set("key2", "value2");

        // Acessa key1 para torná-la mais recente
        smallCache.get("key1");

        // Adiciona key3, deve remover key2 (menos recente)
        smallCache.set("key3", "value3");

        expect(smallCache.has("key1")).toBe(true);
        expect(smallCache.has("key2")).toBe(false);
        expect(smallCache.has("key3")).toBe(true);

        smallCache.destroy();
      });
    });

    describe("Invalidação por Padrão", () => {
      test("deve invalidar entradas por regex", () => {
        cache.set("user:1:profile", { name: "User 1" });
        cache.set("user:2:profile", { name: "User 2" });
        cache.set("user:1:settings", { theme: "dark" });
        cache.set("product:1:details", { name: "Product 1" });

        expect(cache.size()).toBe(4);

        // Invalida todas as entradas de usuário
        const invalidated = cache.invalidatePattern(/^user:/);

        expect(invalidated).toBe(3);
        expect(cache.size()).toBe(1);
        expect(cache.has("product:1:details")).toBe(true);
      });

      test("deve retornar 0 quando nenhuma entrada corresponde ao padrão", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");

        const invalidated = cache.invalidatePattern(/^nonexistent:/);
        expect(invalidated).toBe(0);
        expect(cache.size()).toBe(2);
      });
    });

    describe("Estatísticas", () => {
      test("deve fornecer estatísticas do cache", () => {
        cache.set("key1", "value1");
        cache.set("key2", "value2");
        cache.get("key1"); // hit
        cache.get("key1"); // hit
        cache.get("nonexistent"); // miss

        const stats = cache.getStats();

        expect(stats).toHaveProperty("size", 2);
        expect(stats).toHaveProperty("hits");
        expect(stats).toHaveProperty("misses");
        expect(stats).toHaveProperty("hitRate");
        expect(stats.hits).toBeGreaterThan(0);
        expect(stats.misses).toBeGreaterThan(0);
      });

      test("deve calcular hit rate corretamente", () => {
        cache.set("key1", "value1");

        cache.get("key1"); // hit
        cache.get("key1"); // hit
        cache.get("nonexistent"); // miss

        const stats = cache.getStats();
        expect(stats.hitRate).toBeCloseTo(0.67, 2); // 2 hits / 3 total = 0.67
      });
    });

    describe("Preload", () => {
      test("deve precarregar dados", async () => {
        const dataLoader = jest.fn().mockResolvedValue("loaded-data");

        await cache.preload("preload-key", dataLoader);

        expect(cache.get("preload-key")).toBe("loaded-data");
        expect(dataLoader).toHaveBeenCalledTimes(1);
      });

      test("deve usar dados existentes em vez de recarregar", async () => {
        const dataLoader = jest.fn().mockResolvedValue("loaded-data");

        cache.set("existing-key", "existing-data");
        await cache.preload("existing-key", dataLoader);

        expect(cache.get("existing-key")).toBe("existing-data");
        expect(dataLoader).not.toHaveBeenCalled();
      });
    });
  });

  describe("FinancialCalculationOptimizer", () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new FinancialCalculationOptimizer({
        maxCacheSize: 50,
        cacheTTL: 5000,
      });
    });

    afterEach(() => {
      if (optimizer && typeof optimizer.destroy === "function") {
        optimizer.destroy();
      }
    });

    describe("Otimização de Cálculos", () => {
      test("deve otimizar cálculos financeiros", async () => {
        const mockData = {
          transactions: [
            { id: "1", amount: 100, type: "income" },
            { id: "2", amount: -50, type: "expense" },
          ],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const calculationFn = jest.fn().mockResolvedValue({
          totalIncome: 100,
          totalExpenses: 50,
          netIncome: 50,
        });

        const result = await optimizer.optimizeCalculation(
          "test-calc",
          calculationFn,
          mockData,
        );

        expect(result).toEqual({
          totalIncome: 100,
          totalExpenses: 50,
          netIncome: 50,
        });
        expect(calculationFn).toHaveBeenCalledWith(mockData);
      });

      test("deve usar cache para cálculos repetidos", async () => {
        const mockData = {
          transactions: [{ id: "1", amount: 100, type: "income" }],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const calculationFn = jest
          .fn()
          .mockResolvedValue({ result: "calculated" });

        // Primeira chamada
        const result1 = await optimizer.optimizeCalculation(
          "cache-test",
          calculationFn,
          mockData,
        );

        // Segunda chamada com os mesmos dados
        const result2 = await optimizer.optimizeCalculation(
          "cache-test",
          calculationFn,
          mockData,
        );

        expect(result1).toEqual(result2);
        expect(calculationFn).toHaveBeenCalledTimes(1); // Só deve calcular uma vez
      });

      test("deve recalcular quando dados mudam", async () => {
        const mockData1 = {
          transactions: [{ id: "1", amount: 100, type: "income" }],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const mockData2 = {
          transactions: [{ id: "1", amount: 200, type: "income" }],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const calculationFn = jest
          .fn()
          .mockResolvedValueOnce({ result: "first" })
          .mockResolvedValueOnce({ result: "second" });

        const result1 = await optimizer.optimizeCalculation(
          "change-test",
          calculationFn,
          mockData1,
        );
        const result2 = await optimizer.optimizeCalculation(
          "change-test",
          calculationFn,
          mockData2,
        );

        expect(result1).toEqual({ result: "first" });
        expect(result2).toEqual({ result: "second" });
        expect(calculationFn).toHaveBeenCalledTimes(2);
      });
    });

    describe("Gerenciamento de Cache", () => {
      test("deve limpar cache", async () => {
        const mockData = {
          transactions: [{ id: "1", amount: 100 }],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const calculationFn = jest.fn().mockResolvedValue({ cached: true });

        // Adiciona ao cache
        await optimizer.optimizeCalculation(
          "clear-test",
          calculationFn,
          mockData,
        );
        expect(calculationFn).toHaveBeenCalledTimes(1);

        // Limpa cache
        optimizer.clearCache();

        // Deve recalcular após limpeza
        await optimizer.optimizeCalculation(
          "clear-test",
          calculationFn,
          mockData,
        );
        expect(calculationFn).toHaveBeenCalledTimes(2);
      });

      test("deve otimizar cache removendo entradas expiradas", () => {
        // Simula entradas expiradas
        const stats = optimizer.getStats();
        expect(stats).toHaveProperty("cacheSize");
        expect(stats).toHaveProperty("cacheTimeout");

        // Testa limpeza de cache
        optimizer.clearCache();
        const statsAfterClear = optimizer.getStats();
        expect(statsAfterClear.cacheSize).toBe(0);
      });
    });

    describe("Tratamento de Erros", () => {
      test("deve lidar com erros de cálculo", async () => {
        const mockData = {
          transactions: [],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const calculationFn = jest
          .fn()
          .mockRejectedValue(new Error("Calculation error"));

        await expect(
          optimizer.optimizeCalculation("error-test", calculationFn, mockData),
        ).rejects.toThrow("Calculation error");
      });

      test("deve continuar funcionando após erro", async () => {
        const mockData = {
          transactions: [],
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const errorFn = jest.fn().mockRejectedValue(new Error("Error"));
        const successFn = jest.fn().mockResolvedValue({ success: true });

        // Primeira chamada com erro
        await expect(
          optimizer.optimizeCalculation("error-recovery", errorFn, mockData),
        ).rejects.toThrow();

        // Segunda chamada deve funcionar
        const result = await optimizer.optimizeCalculation(
          "success-test",
          successFn,
          mockData,
        );
        expect(result).toEqual({ success: true });
      });
    });

    describe("Performance", () => {
      test("deve ter performance melhor com cache", async () => {
        const mockData = {
          transactions: Array.from({ length: 1000 }, (_, i) => ({
            id: i.toString(),
            amount: Math.random() * 1000,
            type: "expense",
          })),
          goals: [],
          investments: [],
          accounts: [],
          trips: [],
        };

        const heavyCalculation = jest.fn().mockImplementation(async (data) => {
          // Simula cálculo pesado
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { processed: data.transactions.length };
        });

        const start1 = Date.now();
        await optimizer.optimizeCalculation(
          "perf-test",
          heavyCalculation,
          mockData,
        );
        const time1 = Date.now() - start1;

        const start2 = Date.now();
        await optimizer.optimizeCalculation(
          "perf-test",
          heavyCalculation,
          mockData,
        );
        const time2 = Date.now() - start2;

        // Segunda chamada deve ser muito mais rápida (cache)
        expect(time2).toBeLessThan(time1);
        expect(heavyCalculation).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Integração Cache + Optimizer", () => {
    test("deve funcionar corretamente em conjunto", async () => {
      const cache = new SmartCache({ maxSize: 10, ttl: 1000 });
      const optimizer = new FinancialCalculationOptimizer({ cache });

      const mockData = {
        transactions: [{ id: "1", amount: 100, type: "income" }],
        goals: [],
        investments: [],
        accounts: [],
        trips: [],
      };

      const calculationFn = jest.fn().mockResolvedValue({ integrated: true });

      // Primeira chamada
      const result1 = await optimizer.optimizeCalculation(
        "integration",
        calculationFn,
        mockData,
      );

      // Verifica se foi armazenado no cache
      expect(cache.size()).toBeGreaterThan(0);

      // Segunda chamada deve usar cache
      const result2 = await optimizer.optimizeCalculation(
        "integration",
        calculationFn,
        mockData,
      );

      expect(result1).toEqual(result2);
      expect(calculationFn).toHaveBeenCalledTimes(1);

      cache.destroy();
      optimizer.destroy();
    });
  });
});
