import { PrismaClient, Prisma } from "../../node_modules/.prisma/client-test";
import { DoubleEntryService } from "../../src/services/doubleEntryService";
import { AuditService } from "../../src/services/auditService";
import { setupTestData, cleanDatabase } from "../setup";

describe("DoubleEntryService Integration Tests", () => {
  let prisma: PrismaClient;
  let doubleEntryService: DoubleEntryService;
  let auditService: AuditService;
  let testData: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    auditService = new AuditService(prisma as any);
    doubleEntryService = new DoubleEntryService(prisma as any, auditService);
    testData = await setupTestData(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpar transações entre testes
    await prisma.entry.deleteMany({});
    await prisma.transaction.deleteMany({});
  });

  describe("createTransaction", () => {
    it("should create expense transaction with correct double entries", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense" as const,
        amount: new Prisma.Decimal(100),
        description: "Test expense",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "TEST-001",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "test-expense-1",
      };

      const result =
        await doubleEntryService.createTransaction(transactionData);

      expect(result.transaction.id).toBeDefined();
      expect(result.transaction.type).toBe("expense");
      expect(result.transaction.amount).toEqual(new Prisma.Decimal(100));
      expect(result.entries).toHaveLength(2);

      // Verificar entrada de crédito (conta corrente)
      const creditEntry = result.entries.find((e: any) => e.type === "credit");
      expect(creditEntry).toBeDefined();
      expect(creditEntry!.amount).toEqual(new Prisma.Decimal(100));
      expect(creditEntry!.accountId).toBe(testData.accounts.checking.id);

      // Verificar entrada de débito (despesa)
      const debitEntry = result.entries.find((e: any) => e.type === "debit");
      expect(debitEntry).toBeDefined();
      expect(debitEntry!.amount).toEqual(new Prisma.Decimal(100));
      expect(debitEntry!.accountId).toBe(testData.accounts.officeExpense.id);
    });

    it("should create income transaction with correct double entries", async () => {
      // Primeiro criar uma conta de receita
      const revenueLedger = await prisma.ledger.create({
        data: {
          id: "ledger_revenue",
          tenantId: testData.tenant.id,
          name: "Receitas",
          code: "REVENUE",
          type: "revenue",
          description: "Contas de Receitas",
        },
      });

      const revenueAccount = await prisma.account.create({
        data: {
          id: "acc_revenue",
          tenantId: testData.tenant.id,
          ledgerId: revenueLedger.id,
          name: "Receita de Vendas",
          code: "REVENUE_SALES",
          type: "revenue",
          subtype: "operating_revenue",
          description: "Receitas de vendas",
        },
      });

      const transactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "income" as const,
        amount: new Prisma.Decimal(500),
        description: "Test income",
        categoryId: testData.category.id,
        toAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "TEST-002",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "test-income-1",
      };

      const result =
        await doubleEntryService.createTransaction(transactionData);

      expect(result.transaction.id).toBeDefined();
      expect(result.transaction.type).toBe("income");
      expect(result.transaction.amount).toEqual(new Prisma.Decimal(500));
      expect(result.entries).toHaveLength(2);

      // Verificar entrada de débito (conta corrente)
      const debitEntry = result.entries.find((e: any) => e.type === "debit");
      expect(debitEntry).toBeDefined();
      expect(debitEntry!.amount).toEqual(new Prisma.Decimal(500));
      expect(debitEntry!.accountId).toBe(testData.accounts.checking.id);

      // Verificar entrada de crédito (receita)
      const creditEntry = result.entries.find((e: any) => e.type === "credit");
      expect(creditEntry).toBeDefined();
      expect(creditEntry!.amount).toEqual(new Prisma.Decimal(500));
      expect(creditEntry!.accountId).toBe(revenueAccount.id);
    });

    it("should validate double entry balance", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense" as const,
        amount: new Prisma.Decimal(100),
        description: "Test balance validation",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "TEST-004",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "test-balance-1",
      };

      const result =
        await doubleEntryService.createTransaction(transactionData);

      // Verificar se o total de débitos é igual ao total de créditos
      const totalDebits = result.entries
        .filter((e: any) => e.type === "debit")
        .reduce(
          (sum: Prisma.Decimal, entry: any) => sum.add(entry.amount),
          new Prisma.Decimal(0),
        );

      const totalCredits = result.entries
        .filter((e: any) => e.type === "credit")
        .reduce(
          (sum: Prisma.Decimal, entry: any) => sum.add(entry.amount),
          new Prisma.Decimal(0),
        );

      expect(totalDebits.equals(totalCredits)).toBe(true);
    });

    it("should prevent duplicate transactions with same idempotency key", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense" as const,
        amount: new Prisma.Decimal(75),
        description: "Test idempotency",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "TEST-005",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "test-idempotency-1",
      };

      // Primeira criação deve funcionar
      const result1 =
        await doubleEntryService.createTransaction(transactionData);
      expect(result1.transaction.id).toBeDefined();

      // Segunda criação com mesma chave deve retornar a transação existente
      const result2 =
        await doubleEntryService.createTransaction(transactionData);
      expect(result2.transaction.id).toBe(result1.transaction.id);
    });
  });

  describe("generateTrialBalance", () => {
    it("should generate trial balance report", async () => {
      // Criar algumas transações primeiro
      await doubleEntryService.createTransaction({
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense",
        amount: new Prisma.Decimal(100),
        description: "Test expense for trial balance",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "TB-001",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "trial-balance-1",
      });

      const trialBalance = await doubleEntryService.generateTrialBalance(
        testData.tenant.id,
      );

      expect(trialBalance).toBeDefined();
      expect(trialBalance.accounts).toBeDefined();
      expect(Array.isArray(trialBalance.accounts)).toBe(true);
      expect(trialBalance.totalDebits).toBeDefined();
      expect(trialBalance.totalCredits).toBeDefined();
      expect(trialBalance.isBalanced).toBe(true);
    });
  });

  describe("reverseTransaction", () => {
    it("should reverse a transaction", async () => {
      // Criar transação original
      const originalTransaction = await doubleEntryService.createTransaction({
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense",
        amount: new Prisma.Decimal(150),
        description: "Transaction to reverse",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "REV-001",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "reverse-test-1",
      });

      // Reverter a transação
      const reversalResult = await doubleEntryService.reverseTransaction(
        testData.tenant.id,
        originalTransaction.transaction.id,
        testData.user.id,
        "Test reversal",
      );

      expect(reversalResult.reversalTransaction).toBeDefined();
      expect(reversalResult.reversalTransaction.description).toContain(
        "REVERSAL",
      );
      expect(reversalResult.reversalEntries).toHaveLength(2);

      // Verificar se as entradas de reversão são opostas às originais
      const originalEntries = originalTransaction.entries;
      const reversalEntries = reversalResult.reversalEntries;

      originalEntries.forEach((originalEntry: any) => {
        const correspondingReversal = reversalEntries.find(
          (reversal: any) => reversal.accountId === originalEntry.accountId,
        );
        expect(correspondingReversal).toBeDefined();
        expect(correspondingReversal!.type).toBe(
          originalEntry.type === "debit" ? "credit" : "debit",
        );
        expect(correspondingReversal!.amount).toEqual(originalEntry.amount);
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw error for invalid transaction type", async () => {
      const invalidTransactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "invalid" as any,
        amount: new Prisma.Decimal(100),
        description: "Invalid transaction",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: new Date(),
        reference: "ERR-001",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "error-test-1",
      };

      await expect(
        doubleEntryService.createTransaction(invalidTransactionData),
      ).rejects.toThrow();
    });

    it("should throw error for missing required accounts", async () => {
      const incompleteTransactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense" as const,
        amount: new Prisma.Decimal(100),
        description: "Incomplete transaction",
        categoryId: testData.category.id,
        // fromAccountId missing
        date: new Date(),
        reference: "ERR-002",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "error-test-2",
      };

      await expect(
        doubleEntryService.createTransaction(incompleteTransactionData),
      ).rejects.toThrow();
    });

    it("should throw error for non-existent account", async () => {
      const transactionWithInvalidAccount = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense" as const,
        amount: new Prisma.Decimal(100),
        description: "Transaction with invalid account",
        categoryId: testData.category.id,
        fromAccountId: "non-existent-account-id",
        date: new Date(),
        reference: "ERR-003",
        tags: ["test"],
        metadata: { test: true },
        idempotencyKey: "error-test-3",
      };

      await expect(
        doubleEntryService.createTransaction(transactionWithInvalidAccount),
      ).rejects.toThrow();
    });
  });
});
