import { PrismaClient } from "../../node_modules/.prisma/client-test";
import { createTestData, cleanDatabase } from "../setup";

// Teste simplificado focado no banco de dados

describe("TransactionService Database Tests", () => {
  let prisma: PrismaClient;
  let testData: any;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await cleanDatabase();
    testData = await createTestData();
    console.log("Test data created:", {
      tenant: testData.tenant.id,
      user: testData.user.id,
      category: testData.category.id,
    });
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  describe("Basic Database Operations", () => {
    it("should create and find transaction", async () => {
      const createdTransaction = await prisma.transaction.create({
        data: {
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: 100.5,
          description: "Test transaction",
          date: new Date(),
          metadata: "{}",
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(100);
      expect(transaction.description).toBe("Test expense");
    });

    it("should find transaction by id", async () => {
      const createdTransaction = await prisma.transaction.create({
        data: {
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "income",
          amount: 250.75,
          description: "Test income transaction",
          date: new Date(),
          metadata: "{}",
        },
      });

      const foundTransaction = await prisma.transaction.findUnique({
        where: { id: createdTransaction.id },
      });

      expect(foundTransaction).toBeDefined();
      expect(foundTransaction?.id).toBe(createdTransaction.id);
      expect(foundTransaction?.amount).toBe(200);
    });
  });
});
