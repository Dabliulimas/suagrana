import { PrismaClient, Prisma } from "../../node_modules/.prisma/client-test";
import { prisma, createTestData, TestContext } from "../setup";

describe("DoubleEntryService Basic Tests", () => {
  let testData: TestContext;

  beforeEach(async () => {
    testData = await createTestData();
  });

  describe("Database Operations", () => {
    it("should create transaction with entries", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        userId: testData.user.id,
        type: "expense",
        amount: 150.0,
        description: "Test expense",
        categoryId: testData.category.id,
        date: new Date(),
        reference: "TEST-001",
        status: "completed",
      };

      const transaction = await prisma.transaction.create({
        data: transactionData,
      });

      expect(transaction.id).toBeDefined();
      expect(transaction.type).toBe("expense");
      expect(transaction.amount).toBe(150.0);
      expect(transaction.description).toBe("Test expense");
      expect(transaction.tenantId).toBe(testData.tenant.id);
    });

    it("should create entries for transaction", async () => {
      const transaction = await prisma.transaction.create({
        data: {
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          type: "income",
          amount: 500.0,
          description: "Test income",
          categoryId: testData.category.id,
          date: new Date(),
          reference: "TEST-002",
          status: "completed",
        },
      });

      // Criar entradas de débito e crédito
      const debitEntry = await prisma.entry.create({
        data: {
          tenantId: testData.tenant.id,
          transactionId: transaction.id,
          accountId: testData.accounts.checking.id,
          type: "debit",
          amount: 500.0,
          description: "Debit entry",
        },
      });

      const creditEntry = await prisma.entry.create({
        data: {
          tenantId: testData.tenant.id,
          transactionId: transaction.id,
          accountId: testData.accounts.checking.id,
          type: "credit",
          amount: 500.0,
          description: "Credit entry",
        },
      });

      expect(debitEntry.id).toBeDefined();
      expect(creditEntry.id).toBeDefined();
      expect(debitEntry.amount).toBe(500.0);
      expect(creditEntry.amount).toBe(500.0);
    });
  });
});
