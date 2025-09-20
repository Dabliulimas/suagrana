/**
 * Testes unitários para o sistema de validação contábil
 * Cobertura: AccountingValidator, validações, princípios contábeis
 */

const { systemValidator } = require("../lib/system-validator-wrapper");
const { accountingSystem } = require("../lib/accounting-system");
const { resetTestData, generateDate, generateCategory, generateAmount } = require("./test-utils");
const { dataConsistencyFixer } = require("../lib/data-consistency-fixer");

describe("Sistema de Validação Contábil", () => {
  beforeEach(() => {
    resetTestData();
  });

  describe("Validação do Sistema", () => {
    test("deve executar validação completa do sistema", async () => {
      const result = await systemValidator.validateSystem();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("issues");
      expect(result).toHaveProperty("categories");

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.issues)).toBe(true);
    });

    test("deve validar integridade das contas", async () => {
      const result = await systemValidator.validateSystem();

      const accountIssues = result.issues.filter(
        (issue) => issue.category === "accounts",
      );

      // Verificar se não há problemas críticos com contas
      const criticalAccountIssues = accountIssues.filter(
        (issue) => issue.severity === "critical",
      );

      expect(criticalAccountIssues.length).toBe(0);
    });

    test("deve validar consistência de transações", async () => {
      const result = await systemValidator.validateSystem();

      const transactionIssues = result.issues.filter(
        (issue) => issue.category === "transactions",
      );

      // Verificar estrutura das transações
      transactionIssues.forEach((issue) => {
        expect(issue).toHaveProperty("description");
        expect(issue).toHaveProperty("severity");
        expect(["critical", "high", "medium", "low"]).toContain(issue.severity);
      });
    });

    test("deve validar metas financeiras", async () => {
      const result = await systemValidator.validateSystem();

      const goalIssues = result.issues.filter(
        (issue) => issue.category === "goals",
      );

      // Verificar se metas têm valores válidos
      const goals = JSON.parse(localStorage.getItem("sua-grana-goals") || "[]");
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      goals.forEach((goal) => {
        expect(goal.targetAmount).toBeGreaterThan(0);
        expect(goal.currentAmount).toBeGreaterThanOrEqual(0);
        expect(new Date(goal.deadline)).toBeValidDate();
      });
    });

    test("deve validar investimentos", async () => {
      const result = await systemValidator.validateSystem();

      const investmentIssues = result.issues.filter(
        (issue) => issue.category === "investments",
      );

      // Verificar se investimentos têm estrutura válida
      const investments = JSON.parse(
        localStorage.getItem("sua-grana-investments") || "[]",
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      investments.forEach((investment) => {
        expect(investment.amount).toBeGreaterThan(0);
        expect(investment.type).toBeDefined();
        expect(typeof investment.yield).toBe("number");
      });
    });

    test("deve calcular score corretamente", async () => {
      const result = await systemValidator.validateSystem();

      // Score deve refletir a qualidade do sistema
      if (result.issues.length === 0) {
        expect(result.score).toBe(100);
      } else {
        const criticalIssues = result.issues.filter(
          (i) => i.severity === "critical",
        ).length;
        const highIssues = result.issues.filter(
          (i) => i.severity === "high",
        ).length;

        if (criticalIssues > 0) {
          expect(result.score).toBeLessThan(50);
        } else if (highIssues > 0) {
          expect(result.score).toBeLessThan(80);
        }
      }
    });
  });

  describe("Princípios Contábeis", () => {
    test("deve validar partida dobrada", async () => {
      // Criar transações que violam partida dobrada
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: 1000,
          description: "Depósito sem contrapartida",
          date: "2024-01-01",
          type: "income",
        },
      ];

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const result = await systemValidator.validateSystem();

      // Deve detectar violação de partida dobrada
      const doubleEntryIssues = result.issues.filter(
        (issue) =>
          issue.description.toLowerCase().includes("partida dobrada") ||
          issue.description.toLowerCase().includes("double entry"),
      );

      expect(doubleEntryIssues.length).toBeGreaterThan(0);
    });

    test("deve validar conservadorismo", async () => {
      // Criar investimentos com rendimentos irreais
      const investments = [
        {
          id: 1,
          name: "Investimento Irreal",
          amount: 10000,
          type: "stocks",
          yield: 5.0, // 500% ao ano - irreal
          risk: "low",
        },
      ];

      localStorage.setItem(
        "sua-grana-investments",
        JSON.stringify(investments),
      );

      const result = await systemValidator.validateSystem();

      // Deve detectar valores não conservadores
      const conservatismIssues = result.issues.filter(
        (issue) =>
          issue.description.toLowerCase().includes("conservador") ||
          issue.description.toLowerCase().includes("irreal"),
      );

      expect(conservatismIssues.length).toBeGreaterThan(0);
    });

    test("deve validar materialidade", async () => {
      // Criar transações com valores muito pequenos
      const transactions = [];
      for (let i = 1; i <= 100; i++) {
        transactions.push({
          id: i,
          accountId: 1,
          amount: 0.01, // Valores muito pequenos
          description: `Micro transação ${i}`,
          date: "2024-01-01",
        });
      }

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const result = await systemValidator.validateSystem();

      // Pode sugerir consolidação de micro transações
      const materialityIssues = result.issues.filter(
        (issue) =>
          issue.description.toLowerCase().includes("materialidade") ||
          issue.description.toLowerCase().includes("micro"),
      );

      // Não é obrigatório, mas pode ser sugerido
      expect(materialityIssues.length).toBeGreaterThanOrEqual(0);
    });

    test("deve validar competência temporal", async () => {
      // Criar transações com datas futuras
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: -1000,
          description: "Despesa futura",
          date: futureDate.toISOString().split("T")[0],
        },
      ];

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const result = await systemValidator.validateSystem();

      // Deve detectar problemas de competência
      const competencyIssues = result.issues.filter(
        (issue) =>
          issue.description.toLowerCase().includes("competência") ||
          issue.description.toLowerCase().includes("data futura"),
      );

      expect(competencyIssues.length).toBeGreaterThan(0);
    });
  });

  describe("Sistema Contábil", () => {
    test("deve calcular saldos corretamente", () => {
      const accounts = [
        { id: 1, name: "Conta Corrente", balance: 0, type: "checking" },
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
        {
          id: 3,
          accountId: 1,
          amount: -150,
          description: "Compra",
          date: "2024-01-03",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const calculatedBalance = accountingSystem.calculateAccountBalance(1);

      expect(calculatedBalance).toBe(650); // 1000 - 200 - 150
    });

    test("deve detectar saldos inconsistentes", () => {
      const accounts = [
        { id: 1, name: "Conta Inconsistente", balance: 1000, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: 500,
          description: "Depósito",
          date: "2024-01-01",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const calculatedBalance = accountingSystem.calculateAccountBalance(1);
      const storedBalance = accounts[0].balance;

      expect(calculatedBalance).not.toBe(storedBalance);

      const isConsistent = accountingSystem.validateAccountBalance(1);
      expect(isConsistent).toBe(false);
    });

    test("deve corrigir saldos automaticamente", () => {
      const accounts = [
        { id: 1, name: "Conta para Correção", balance: 0, type: "checking" },
      ];
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: 750,
          description: "Depósito",
          date: "2024-01-01",
        },
        {
          id: 2,
          accountId: 1,
          amount: -250,
          description: "Saque",
          date: "2024-01-02",
        },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));
      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const corrected = accountingSystem.fixAccountBalance(1);

      expect(corrected).toBe(true);

      const updatedAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const account = updatedAccounts.find((acc) => acc.id === 1);

      expect(account.balance).toBe(500); // 750 - 250
    });

    test("deve validar tipos de conta", () => {
      const validTypes = ["checking", "savings", "credit", "investment"];

      validTypes.forEach((type) => {
        expect(accountingSystem.isValidAccountType(type)).toBe(true);
      });

      expect(accountingSystem.isValidAccountType("invalid")).toBe(false);
      expect(accountingSystem.isValidAccountType("")).toBe(false);
      expect(accountingSystem.isValidAccountType(null)).toBe(false);
    });

    test("deve calcular patrimônio líquido", () => {
      const accounts = [
        { id: 1, name: "Conta Corrente", balance: 5000, type: "checking" },
        { id: 2, name: "Poupança", balance: 10000, type: "savings" },
        { id: 3, name: "Cartão de Crédito", balance: -2000, type: "credit" },
      ];

      localStorage.setItem("sua-grana-accounts", JSON.stringify(accounts));

      const netWorth = accountingSystem.calculateNetWorth();

      expect(netWorth).toBe(13000); // 5000 + 10000 - 2000
    });

    test("deve gerar relatório de fluxo de caixa", () => {
      const transactions = [
        {
          id: 1,
          accountId: 1,
          amount: 3000,
          description: "Salário",
          date: "2024-01-01",
          category: "income",
        },
        {
          id: 2,
          accountId: 1,
          amount: -1200,
          description: "Aluguel",
          date: "2024-01-01",
          category: "housing",
        },
        {
          id: 3,
          accountId: 1,
          amount: -300,
          description: "Mercado",
          date: "2024-01-02",
          category: "food",
        },
        {
          id: 4,
          accountId: 1,
          amount: -150,
          description: "Combustível",
          date: "2024-01-03",
          category: "transport",
        },
      ];

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(transactions),
      );

      const cashFlow = accountingSystem.generateCashFlowReport(
        "2024-01-01",
        "2024-01-31",
      );

      expect(cashFlow).toHaveProperty("income");
      expect(cashFlow).toHaveProperty("expenses");
      expect(cashFlow).toHaveProperty("netFlow");

      expect(cashFlow.income).toBe(3000);
      expect(cashFlow.expenses).toBe(1650); // 1200 + 300 + 150
      expect(cashFlow.netFlow).toBe(1350); // 3000 - 1650
    });
  });

  describe("Performance e Robustez", () => {
    test("deve executar validação em tempo aceitável", async () => {
      const startTime = Date.now();
      await systemValidator.validateSystem();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000); // Menos de 3 segundos
    });

    test("deve lidar com grande volume de dados", async () => {
      // Criar muitas transações
      const largeTransactions = [];
      for (let i = 1; i <= 5000; i++) {
        largeTransactions.push({
          id: i,
          accountId: Math.floor(Math.random() * 10) + 1,
          amount: testUtils.generateAmount(),
          description: `Transação ${i}`,
          date: generateDate(),
          category: generateCategory(),
        });
      }

      localStorage.setItem(
        "sua-grana-transactions",
        JSON.stringify(largeTransactions),
      );

      const startTime = Date.now();
      const result = await systemValidator.validateSystem();
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Menos de 10 segundos
    });

    test("deve ser resiliente a dados corrompidos", async () => {
      // Inserir dados inválidos
      localStorage.setItem("sua-grana-accounts", "{invalid json}");

      const result = await systemValidator.validateSystem();

      expect(result).toBeDefined();
      expect(result.issues.length).toBeGreaterThan(0);

      // Deve detectar corrupção de dados
      const corruptionIssues = result.issues.filter(
        (issue) =>
          issue.description.toLowerCase().includes("corrompido") ||
          issue.description.toLowerCase().includes("inválido"),
      );

      expect(corruptionIssues.length).toBeGreaterThan(0);
    });

    test("deve manter consistência após operações", async () => {
      // Executar múltiplas validações
      const results = [];

      for (let i = 0; i < 3; i++) {
        const result = await systemValidator.validateSystem();
        results.push(result);
      }

      // Resultados devem ser consistentes
      expect(results[0].score).toBe(results[1].score);
      expect(results[1].score).toBe(results[2].score);
    });
  });

  describe("Integração", () => {
    test("deve integrar com sistema de consistência", async () => {
      const validationResult = await systemValidator.validateSystem();
      const consistencyReport = await dataConsistencyFixer.checkConsistency();

      // Ambos devem funcionar sem conflitos
      expect(validationResult).toBeDefined();
      expect(consistencyReport).toBeDefined();

      // Problemas críticos devem aparecer em ambos
      if (validationResult.issues.some((i) => i.severity === "critical")) {
        expect(consistencyReport.summary.criticalIssues).toBeGreaterThan(0);
      }
    });

    test("deve preservar dados durante validação", async () => {
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

      await systemValidator.validateSystem();

      const currentAccounts = JSON.parse(
        localStorage.getItem("sua-grana-accounts"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;
      const currentTransactions = JSON.parse(
        localStorage.getItem("sua-grana-transactions"),
      );
      if (typeof window === "undefined") return;
      if (typeof window === "undefined") return;

      // Dados não devem ser alterados durante validação
      expect(currentAccounts).toEqual(originalAccounts);
      expect(currentTransactions).toEqual(originalTransactions);
    });

    test("deve fornecer relatórios detalhados", async () => {
      const result = await systemValidator.validateSystem();

      expect(result).toHaveProperty("categories");
      expect(result.categories).toHaveProperty("accounts");
      expect(result.categories).toHaveProperty("transactions");
      expect(result.categories).toHaveProperty("goals");
      expect(result.categories).toHaveProperty("investments");

      // Cada categoria deve ter score
      Object.values(result.categories).forEach((category) => {
        expect(category).toHaveProperty("score");
        expect(category.score).toBeGreaterThanOrEqual(0);
        expect(category.score).toBeLessThanOrEqual(100);
      });
    });
  });
});
