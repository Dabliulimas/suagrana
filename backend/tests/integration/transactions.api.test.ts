import request from "supertest";
import { app } from "../../src/app";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  prisma,
  createTestData,
  createAuthHeaders,
  TestContext,
} from "../jest.setup";

describe("Transactions API", () => {
  let testData: TestContext;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    testData = await createTestData();
    authHeaders = createAuthHeaders();
  });

  describe("POST /api/transactions", () => {
    it("should create expense transaction successfully", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        type: "expense",
        amount: 150.5,
        description: "Office supplies purchase",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: "2024-01-15T10:30:00Z",
        reference: "INV-001",
        tags: ["office", "supplies"],
        metadata: {
          supplier: "Office Depot",
          paymentMethod: "credit_card",
        },
        idempotencyKey: "test-expense-api-1",
      };

      const response = await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(transactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        type: "expense",
        amount: 150.5,
        description: "Office supplies purchase",
        category: "Material de Escritório",
        status: "processed",
        reference: "INV-001",
        tags: ["office", "supplies"],
        metadata: {
          supplier: "Office Depot",
          paymentMethod: "credit_card",
        },
        entries: expect.arrayContaining([
          expect.objectContaining({
            type: "debit",
            amount: 150.5,
            account: expect.objectContaining({
              name: "Despesas de Escritório",
              type: "expense",
            }),
          }),
          expect.objectContaining({
            type: "credit",
            amount: 150.5,
            account: expect.objectContaining({
              name: "Conta Corrente",
              type: "asset",
            }),
          }),
        ]),
        createdAt: expect.any(String),
      });

      // Verificar se as entradas foram criadas no banco
      const entries = await prisma.entry.findMany({
        where: { transactionId: response.body.id },
      });

      expect(entries).toHaveLength(2);
      expect(
        entries.reduce(
          (sum, entry) =>
            entry.type === "debit"
              ? sum + Number(entry.amount)
              : sum - Number(entry.amount),
          0,
        ),
      ).toBe(0); // Verificar balanceamento
    });

    it("should create income transaction successfully", async () => {
      // Criar conta de receita para o teste
      const revenueLedger = await prisma.ledger.create({
        data: {
          id: "ledger_revenue_test",
          tenantId: testData.tenant.id,
          name: "Receitas",
          code: "REVENUE",
          type: "revenue",
          description: "Contas de Receitas",
        },
      });

      const revenueAccount = await prisma.account.create({
        data: {
          id: "acc_service_revenue_test",
          tenantId: testData.tenant.id,
          ledgerId: revenueLedger.id,
          name: "Receita de Serviços",
          code: "SERVICE_REV",
          type: "revenue",
          subtype: "operating_revenue",
          description: "Receita com prestação de serviços",
          isActive: true,
        },
      });

      const transactionData = {
        tenantId: testData.tenant.id,
        type: "income",
        amount: 1000,
        description: "Service payment received",
        categoryId: testData.category.id,
        toAccountId: testData.accounts.checking.id,
        date: "2024-01-15T14:00:00Z",
        reference: "PAY-001",
        tags: ["service", "payment"],
        metadata: {
          client: "ABC Company",
          project: "Website Development",
        },
        idempotencyKey: "test-income-api-1",
      };

      const response = await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(transactionData)
        .expect(201);

      expect(response.body.type).toBe("income");
      expect(response.body.amount).toBe(1000);
      expect(response.body.entries).toHaveLength(2);

      // Verificar que a conta corrente foi debitada (recebeu o dinheiro)
      const debitEntry = response.body.entries.find(
        (e: any) => e.type === "debit",
      );
      expect(debitEntry.account.id).toBe(testData.accounts.checking.id);

      // Verificar que a conta de receita foi creditada
      const creditEntry = response.body.entries.find(
        (e: any) => e.type === "credit",
      );
      expect(creditEntry.account.id).toBe(revenueAccount.id);
    });

    it("should create transfer transaction successfully", async () => {
      // Criar segunda conta para transferência
      const savingsAccount = await prisma.account.create({
        data: {
          id: "acc_savings_test",
          tenantId: testData.tenant.id,
          ledgerId: testData.ledgers.assets.id,
          name: "Conta Poupança",
          code: "SAVINGS",
          type: "asset",
          subtype: "current_asset",
          description: "Conta poupança",
          isActive: true,
        },
      });

      const transactionData = {
        tenantId: testData.tenant.id,
        type: "transfer",
        amount: 500,
        description: "Transfer to savings account",
        fromAccountId: testData.accounts.checking.id,
        toAccountId: savingsAccount.id,
        date: "2024-01-15T16:00:00Z",
        reference: "TRF-001",
        idempotencyKey: "test-transfer-api-1",
      };

      const response = await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(transactionData)
        .expect(201);

      expect(response.body.type).toBe("transfer");
      expect(response.body.amount).toBe(500);
      expect(response.body.entries).toHaveLength(2);

      // Verificar débito na conta destino
      const debitEntry = response.body.entries.find(
        (e: any) => e.type === "debit",
      );
      expect(debitEntry.account.id).toBe(savingsAccount.id);

      // Verificar crédito na conta origem
      const creditEntry = response.body.entries.find(
        (e: any) => e.type === "credit",
      );
      expect(creditEntry.account.id).toBe(testData.accounts.checking.id);
    });

    it("should create installment transactions successfully", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        type: "expense",
        amount: 600,
        description: "Equipment purchase",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        date: "2024-01-15T10:00:00Z",
        installments: 3,
        reference: "EQUIP-001",
        idempotencyKey: "test-installment-api-1",
      };

      const response = await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(transactionData)
        .expect(201);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);

      // Verificar cada parcela
      response.body.forEach((transaction: any, index: number) => {
        expect(transaction.amount).toBe(200); // 600 / 3
        expect(transaction.description).toContain(`(${index + 1}/3)`);
        expect(transaction.entries).toHaveLength(2);
      });

      // Verificar se todas as transações foram criadas no banco
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId: testData.tenant.id,
          description: { contains: "Equipment purchase" },
        },
      });

      expect(transactions).toHaveLength(3);
    });

    it("should return 400 for invalid transaction data", async () => {
      const invalidData = {
        tenantId: testData.tenant.id,
        type: "expense",
        amount: -100, // Valor negativo
        description: "Invalid transaction",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        idempotencyKey: "test-invalid-api-1",
      };

      const response = await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toContain("valor deve ser positivo");
    });

    it("should return 401 for unauthenticated request", async () => {
      const transactionData = {
        tenantId: testData.tenant.id,
        type: "expense",
        amount: 100,
        description: "Unauthorized transaction",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        idempotencyKey: "test-unauthorized-api-1",
      };

      await request(app)
        .post("/api/transactions")
        .send(transactionData)
        .expect(401);
    });

    it("should return 403 for cross-tenant access", async () => {
      // Criar outro tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          id: "other_tenant_test",
          name: "Other Tenant",
          domain: "other.com",
          settings: {},
          isActive: true,
        },
      });

      const transactionData = {
        tenantId: otherTenant.id, // Tentativa de acesso a outro tenant
        type: "expense",
        amount: 100,
        description: "Cross-tenant transaction",
        categoryId: testData.category.id,
        fromAccountId: testData.accounts.checking.id,
        idempotencyKey: "test-cross-tenant-api-1",
      };

      await request(app)
        .post("/api/transactions")
        .set(authHeaders)
        .send(transactionData)
        .expect(403);
    });
  });

  describe("GET /api/transactions", () => {
    beforeEach(async () => {
      // Criar transações de teste
      await prisma.transaction.createMany({
        data: [
          {
            id: "txn_1",
            tenantId: testData.tenant.id,
            userId: testData.user.id,
            categoryId: testData.category.id,
            type: "expense",
            amount: new Prisma.Decimal(100),
            description: "Test expense 1",
            status: "processed",
            date: new Date("2024-01-15"),
            tags: ["test"],
            metadata: {},
            idempotencyKey: "test-list-1",
          },
          {
            id: "txn_2",
            tenantId: testData.tenant.id,
            userId: testData.user.id,
            categoryId: testData.category.id,
            type: "expense",
            amount: new Prisma.Decimal(200),
            description: "Test expense 2",
            status: "processed",
            date: new Date("2024-01-16"),
            tags: ["test"],
            metadata: {},
            idempotencyKey: "test-list-2",
          },
          {
            id: "txn_3",
            tenantId: testData.tenant.id,
            userId: testData.user.id,
            categoryId: testData.category.id,
            type: "income",
            amount: new Prisma.Decimal(500),
            description: "Test income",
            status: "processed",
            date: new Date("2024-01-17"),
            tags: ["income"],
            metadata: {},
            idempotencyKey: "test-list-3",
          },
        ],
      });
    });

    it("should return paginated transactions", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({ page: 1, limit: 2 })
        .set(authHeaders)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasMore: true,
      });
      expect(response.body.summary).toMatchObject({
        totalIncome: 500,
        totalExpense: 300,
        netAmount: 200,
        transactionCount: 3,
      });
    });

    it("should filter transactions by type", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({ type: "expense" })
        .set(authHeaders)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      expect(
        response.body.transactions.every((t: any) => t.type === "expense"),
      ).toBe(true);
    });

    it("should filter transactions by date range", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({
          startDate: "2024-01-16T00:00:00Z",
          endDate: "2024-01-17T23:59:59Z",
        })
        .set(authHeaders)
        .expect(200);

      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.transactions.map((t: any) => t.id)).toEqual([
        "txn_3",
        "txn_2",
      ]); // Ordenado por data desc
    });

    it("should search transactions by description", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({ search: "income" })
        .set(authHeaders)
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].description).toContain("income");
    });

    it("should filter by amount range", async () => {
      const response = await request(app)
        .get("/api/transactions")
        .query({ minAmount: 150, maxAmount: 300 })
        .set(authHeaders)
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].amount).toBe(200);
    });

    it("should return 401 for unauthenticated request", async () => {
      await request(app).get("/api/transactions").expect(401);
    });
  });

  describe("GET /api/transactions/:id", () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          id: "txn_detail_test",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(150),
          description: "Detailed transaction",
          status: "processed",
          date: new Date(),
          tags: ["detail"],
          metadata: { test: true },
          idempotencyKey: "test-get-detail-1",
        },
      });
      transactionId = transaction.id;
    });

    it("should return transaction details", async () => {
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        id: transactionId,
        type: "expense",
        amount: 150,
        description: "Detailed transaction",
        category: "Material de Escritório",
        status: "processed",
        tags: ["detail"],
        metadata: { test: true },
      });
    });

    it("should return 404 for non-existent transaction", async () => {
      await request(app)
        .get("/api/transactions/non-existent-id")
        .set(authHeaders)
        .expect(404);
    });

    it("should return 403 for cross-tenant access", async () => {
      // Criar transação em outro tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          id: "other_tenant_detail",
          name: "Other Tenant",
          domain: "other.com",
          settings: {},
          isActive: true,
        },
      });

      const otherTransaction = await prisma.transaction.create({
        data: {
          id: "txn_other_tenant",
          tenantId: otherTenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(100),
          description: "Other tenant transaction",
          status: "processed",
          date: new Date(),
          tags: [],
          metadata: {},
          idempotencyKey: "test-other-tenant-1",
        },
      });

      await request(app)
        .get(`/api/transactions/${otherTransaction.id}`)
        .set(authHeaders)
        .expect(403);
    });
  });

  describe("PUT /api/transactions/:id", () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          id: "txn_update_test",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(100),
          description: "Original description",
          status: "processed",
          date: new Date(),
          tags: ["original"],
          metadata: { original: true },
          idempotencyKey: "test-update-1",
        },
      });
      transactionId = transaction.id;
    });

    it("should update transaction successfully", async () => {
      const updateData = {
        description: "Updated description",
        tags: ["updated", "modified"],
        metadata: { updated: true, version: 2 },
      };

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: transactionId,
        description: "Updated description",
        tags: ["updated", "modified"],
        metadata: { updated: true, version: 2 },
      });

      // Verificar se foi atualizado no banco
      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      expect(updatedTransaction?.description).toBe("Updated description");
      expect(updatedTransaction?.tags).toEqual(["updated", "modified"]);
    });

    it("should return 404 for non-existent transaction", async () => {
      await request(app)
        .put("/api/transactions/non-existent-id")
        .set(authHeaders)
        .send({ description: "Updated" })
        .expect(404);
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    let transactionId: string;

    beforeEach(async () => {
      const transaction = await prisma.transaction.create({
        data: {
          id: "txn_delete_test",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(100),
          description: "Transaction to delete",
          status: "processed",
          date: new Date(),
          tags: [],
          metadata: {},
          idempotencyKey: "test-delete-1",
        },
      });
      transactionId = transaction.id;

      // Criar entradas para a transação
      await prisma.entry.createMany({
        data: [
          {
            id: "entry_delete_1",
            tenantId: testData.tenant.id,
            transactionId: transaction.id,
            accountId: testData.accounts.officeExpense.id,
            type: "debit",
            amount: new Prisma.Decimal(100),
            description: "Test debit entry",
          },
          {
            id: "entry_delete_2",
            tenantId: testData.tenant.id,
            transactionId: transaction.id,
            accountId: testData.accounts.checking.id,
            type: "credit",
            amount: new Prisma.Decimal(100),
            description: "Test credit entry",
          },
        ],
      });
    });

    it("should delete transaction by creating reversal", async () => {
      await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .set(authHeaders)
        .expect(204);

      // Verificar se a transação de estorno foi criada
      const reversalTransactions = await prisma.transaction.findMany({
        where: {
          tenantId: testData.tenant.id,
          description: { contains: "ESTORNO" },
        },
      });

      expect(reversalTransactions).toHaveLength(1);
      expect(reversalTransactions[0].description).toContain(
        "Transaction to delete",
      );

      // Verificar se as entradas de estorno foram criadas
      const reversalEntries = await prisma.entry.findMany({
        where: { transactionId: reversalTransactions[0].id },
      });

      expect(reversalEntries).toHaveLength(2);

      // As entradas de estorno devem ser opostas às originais
      const originalEntries = await prisma.entry.findMany({
        where: { transactionId },
      });

      const originalDebit = originalEntries.find((e) => e.type === "debit");
      const reversalCredit = reversalEntries.find((e) => e.type === "credit");
      expect(originalDebit?.accountId).toBe(reversalCredit?.accountId);

      const originalCredit = originalEntries.find((e) => e.type === "credit");
      const reversalDebit = reversalEntries.find((e) => e.type === "debit");
      expect(originalCredit?.accountId).toBe(reversalDebit?.accountId);
    });

    it("should return 404 for non-existent transaction", async () => {
      await request(app)
        .delete("/api/transactions/non-existent-id")
        .set(authHeaders)
        .expect(404);
    });
  });
});
