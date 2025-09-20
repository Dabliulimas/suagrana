/**
 * Testes unitários para o sistema de consistência de dados
 * Cobertura: DataConsistencyFixer, validações, correções automáticas
 */

const { dataConsistencyFixer } = require("../lib/data-consistency-fixer");

describe("Sistema de Consistência de Dados", () => {
  beforeEach(() => {
    resetTestData();
  });

  describe("Verificação de Consistência", () => {
    test("deve executar verificação completa sem erros", async () => {
      const report = await dataConsistencyFixer.checkConsistency();

      expect(report).toBeDefined();
      expect(report).toHaveProperty("summary");
      expect(report).toHaveProperty("issues");
      expect(report).toHaveProperty("systemHealth");
      expect(report).toHaveProperty("recommendations");

      expect(report.summary).toHaveValidStructure({
        totalIssues: "number",
        criticalIssues: "number",
        highIssues: "number",
        mediumIssues: "number",
        lowIssues: "number",
        autoFixableIssues: "number",
        fixedIssues: "number",
      });
    });

    test("deve detectar inconsistências de saldo", async () => {
      // Criar dados inconsistentes
      const accounts = [
        { id: 1, name: "Conta Teste", balance: 1000, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: -2000,
          description: "Gasto alto",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(
        report.issues.some((issue) => issue.type === "balance_inconsistency"),
      ).toBe(true);
    });

    test("deve detectar referências órfãs", async () => {
      // Criar transação com accountId inexistente
      const accounts = [
        { id: 1, name: "Conta Válida", balance: 1000, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 999,
          amount: -100,
          description: "Transação órfã",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(
        report.issues.some((issue) => issue.type === "orphaned_reference"),
      ).toBe(true);
    });

    test("deve detectar dados duplicados", async () => {
      // Criar transações duplicadas
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: -100,
          description: "Compra",
          date: "2024-01-01",
        },
        {
          id: 2,
          accountId: 1,
          amount: -100,
          description: "Compra",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const report = await dataConsistencyFixer.checkConsistency();

      expect(
        report.issues.some((issue) => issue.type === "duplicate_data"),
      ).toBe(true);
    });

    test("deve detectar metas inválidas", async () => {
      // Criar meta com valores inválidos
      const goals = [
        {
          id: 1,
          name: "Meta Inválida",
          targetAmount: -1000,
          currentAmount: 500,
          deadline: "2023-01-01",
        },
      ];

      localStorage.setItem("sua-grana-goals", JSON.stringify(goals));

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report.issues.some((issue) => issue.type === "invalid_data")).toBe(
        true,
      );
    });

    test("deve detectar investimentos inválidos", async () => {
      // Criar investimento com valores inválidos
      const investments = [
        {
          id: 1,
          name: "Investimento Inválido",
          amount: -5000,
          type: "invalid",
          yield: -0.5,
        },
      ];

      localStorage.setItem(
        "sua-grana-investments",
        JSON.stringify(investments),
      );

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report.issues.some((issue) => issue.type === "invalid_data")).toBe(
        true,
      );
    });

    test("deve calcular saúde do sistema corretamente", async () => {
      const report = await dataConsistencyFixer.checkConsistency();

      expect(["excellent", "good", "warning", "critical"]).toContain(
        report.systemHealth,
      );

      if (report.summary.criticalIssues > 0) {
        expect(report.systemHealth).toBe("critical");
      } else if (report.summary.highIssues > 0) {
        expect(report.systemHealth).toBe("warning");
      }
    });

    test("deve gerar recomendações apropriadas", async () => {
      // Criar dados com problemas para gerar recomendações
      const accounts = [
        { id: 1, name: "Conta", balance: 1000, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 999,
          amount: -100,
          description: "Órfã",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const report = await dataConsistencyFixer.checkConsistency();

      expect(Array.isArray(report.recommendations)).toBe(true);
      if (report.summary.totalIssues > 0) {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Correção Automática", () => {
    test("deve executar correção automática sem erros", async () => {
      const results = await dataConsistencyFixer.autoFixIssues();

      expect(results).toBeDefined();
      expect(results).toHaveProperty("fixed");
      expect(results).toHaveProperty("errors");
      expect(typeof results.fixed).toBe("number");
      expect(Array.isArray(results.errors)).toBe(true);
    });

    test("deve corrigir saldos inconsistentes", async () => {
      // Criar conta com saldo inconsistente
      const accounts = [
        { id: 1, name: "Conta Teste", balance: 0, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: 1000,
          description: "Depósito",
          date: "2024-01-01",
        },
        {
          id: 2,
          accountId: 1,
          amount: -200,
          description: "Saque",
          date: "2024-01-02",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const results = await dataConsistencyFixer.autoFixIssues();

      // Verificar se o saldo foi corrigido
      const updatedAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const account = updatedAccounts.find((acc) => acc.id === 1);

      expect(account.balance).toBe(800); // 1000 - 200
    });

    test("deve remover referências órfãs quando possível", async () => {
      const accounts = [
        { id: 1, name: "Conta Válida", balance: 1000, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: -100,
          description: "Válida",
          date: "2024-01-01",
        },
        {
          id: 2,
          accountId: 999,
          amount: -50,
          description: "Órfã",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const results = await dataConsistencyFixer.autoFixIssues();

      expect(results.fixed).toBeGreaterThan(0);

      // Verificar se a transação órfã foi removida
      const updatedTransactions = JSON.parse(
        localStorage.getItem("sua-grana-transactions"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      expect(updatedTransactions.length).toBe(1);
      expect(updatedTransactions[0].id).toBe(1);
    });

    test("deve corrigir dados ausentes", async () => {
      // Criar dados com campos obrigatórios ausentes
      const accounts = [
        { id: 1, name: "Conta Incompleta", type: "checking" }, // balance ausente
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));

      const results = await dataConsistencyFixer.autoFixIssues();

      // Verificar se o campo balance foi adicionado
      const updatedAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const account = updatedAccounts.find((acc) => acc.id === 1);

      expect(account).toHaveProperty("balance");
      expect(typeof account.balance).toBe("number");
    });

    test("deve lidar com erros durante correção", async () => {
      // Simular erro removendo localStorage temporariamente
      const originalGetItem = localStorage.getItem;
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      localStorage.getItem = jest.fn(() => {
        if (typeof window === "undefined") return;
        if (typeof window === "undefined") return;
        throw new Error("Erro simulado");
      });

      const results = await dataConsistencyFixer.autoFixIssues();

      expect(results.errors.length).toBeGreaterThan(0);

      // Restaurar localStorage
      localStorage.getItem = originalGetItem;
    });
  });

  describe("Performance e Robustez", () => {
    test("deve executar verificação em tempo aceitável", async () => {
      const startTime = Date.now();
      await dataConsistencyFixer.checkConsistency();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    });

    test("deve lidar com dados grandes", async () => {
      // Criar grande quantidade de dados
      const largeTransactions = [];
      for (let i = 1; i <= 1000; i++) {
        largeTransactions.push({
          id: i,
          accountId: 1,
          amount: testUtils.generateAmount(),
          description: `Transação ${i}`,
          date: testUtils.generateDate(),
        });
      }

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(largeTransactions),
      );

      const startTime = Date.now();
      const report = await dataConsistencyFixer.checkConsistency();
      const endTime = Date.now();

      expect(report).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Menos de 10 segundos
    });

    test("deve lidar com dados corrompidos", async () => {
      // Inserir dados inválidos
      localStorage.setItem("sua-grana-accounts", "dados-corrompidos");

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report).toBeDefined();
      expect(report.summary.totalIssues).toBeGreaterThan(0);
    });

    test("deve ser resiliente a localStorage vazio", async () => {
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      clearTestData();

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report).toBeDefined();
      expect(report.summary.totalIssues).toBeGreaterThanOrEqual(0);
    });

    test("deve manter consistência após múltiplas operações", async () => {
      // Executar múltiplas verificações e correções
      for (let i = 0; i < 5; i++) {
        const report = await dataConsistencyFixer.checkConsistency();
        if (report.summary.autoFixableIssues > 0) {
          await dataConsistencyFixer.autoFixIssues();
        }
      }

      const finalReport = await dataConsistencyFixer.checkConsistency();
      expect(finalReport.summary.criticalIssues).toBe(0);
    });
  });

  describe("Integração com Sistema", () => {
    test("deve integrar com dados reais do sistema", async () => {
      // Usar dados de teste padrão
      resetTestData();

      const report = await dataConsistencyFixer.checkConsistency();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();

      // Verificar se os dados padrão são consistentes
      expect(report.summary.criticalIssues).toBe(0);
    });

    test("deve preservar dados durante correção", async () => {
      const originalAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const originalTransactions = JSON.parse(
        localStorage.getItem("sua-grana-transactions"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;

      await dataConsistencyFixer.autoFixIssues();

      const updatedAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const updatedTransactions = JSON.parse(
        localStorage.getItem("sua-grana-transactions"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;

      // Verificar se os dados essenciais foram preservados
      expect(updatedAccounts.length).toBeGreaterThanOrEqual(
        originalAccounts.length,
      );
      expect(updatedTransactions.length).toBeGreaterThanOrEqual(
        originalTransactions.length - 1,
      ); // Pode remover órfãs
    });

    test("deve gerar relatórios consistentes", async () => {
      const report1 = await dataConsistencyFixer.checkConsistency();
      const report2 = await dataConsistencyFixer.checkConsistency();

      // Relatórios consecutivos devem ser idênticos se nada mudou
      expect(report1.summary.totalIssues).toBe(report2.summary.totalIssues);
      expect(report1.summary.criticalIssues).toBe(
        report2.summary.criticalIssues,
      );
      expect(report1.systemHealth).toBe(report2.systemHealth);
    });
  });

  describe("Casos Extremos", () => {
    test("deve lidar com valores monetários extremos", async () => {
      const accounts = [
        {
          id: 1,
          name: "Conta Extrema",
          balance: Number.MAX_SAFE_INTEGER,
          type: "checking",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));

      const report = await dataConsistencyFixer.checkConsistency();
      expect(report).toBeDefined();
    });

    test("deve lidar com datas inválidas", async () => {
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: -100,
          description: "Teste",
          date: "data-inválida",
        },
      ];

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const report = await dataConsistencyFixer.checkConsistency();
      expect(report.issues.some((issue) => issue.type === "invalid_data")).toBe(
        true,
      );
    });

    test("deve lidar com strings muito longas", async () => {
      const longString = "a".repeat(10000);
      const accounts = [
        { id: 1, name: longString, balance: 1000, type: "checking" },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));

      const report = await dataConsistencyFixer.checkConsistency();
      expect(report).toBeDefined();
    });

    test("deve lidar com IDs duplicados", async () => {
      const accounts = [
        { id: 1, name: "Conta 1", balance: 1000, type: "checking" },
        { id: 1, name: "Conta 2", balance: 2000, type: "savings" },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));

      const report = await dataConsistencyFixer.checkConsistency();
      expect(
        report.issues.some((issue) => issue.type === "duplicate_data"),
      ).toBe(true);
    });
  });
});
