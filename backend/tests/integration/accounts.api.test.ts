import request from "supertest";
import { app } from "../../src/app";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  prisma,
  createTestData,
  createAuthHeaders,
  TestContext,
} from "../jest.setup";

describe("Accounts API", () => {
  let testData: TestContext;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    testData = await createTestData();
    authHeaders = createAuthHeaders();
  });

  describe("GET /api/accounts", () => {
    it("should return all accounts for tenant", async () => {
      const response = await request(app)
        .get("/api/accounts")
        .set(authHeaders)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verificar estrutura da conta
      const account = response.body[0];
      expect(account).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
        type: expect.stringMatching(
          /^(asset|liability|equity|revenue|expense)$/,
        ),
        subtype: expect.any(String),
        balance: expect.any(Number),
        isActive: expect.any(Boolean),
        ledger: expect.objectContaining({
          name: expect.any(String),
          type: expect.any(String),
        }),
      });

      // Verificar que todas as contas pertencem ao tenant correto
      response.body.forEach((account: any) => {
        expect(account.tenantId).toBe(testData.tenant.id);
      });
    });

    it("should filter accounts by type", async () => {
      const response = await request(app)
        .get("/api/accounts")
        .query({ type: "asset" })
        .set(authHeaders)
        .expect(200);

      expect(
        response.body.every((account: any) => account.type === "asset"),
      ).toBe(true);
    });

    it("should filter accounts by ledger", async () => {
      const response = await request(app)
        .get("/api/accounts")
        .query({ ledgerId: testData.ledgers.assets.id })
        .set(authHeaders)
        .expect(200);

      expect(
        response.body.every(
          (account: any) => account.ledger.id === testData.ledgers.assets.id,
        ),
      ).toBe(true);
    });

    it("should filter active accounts only", async () => {
      // Criar conta inativa
      await prisma.account.create({
        data: {
          id: "acc_inactive_test",
          tenantId: testData.tenant.id,
          ledgerId: testData.ledgers.assets.id,
          name: "Conta Inativa",
          code: "INACTIVE",
          type: "asset",
          subtype: "current_asset",
          description: "Conta para teste de filtro",
          isActive: false,
        },
      });

      const response = await request(app)
        .get("/api/accounts")
        .query({ active: "true" })
        .set(authHeaders)
        .expect(200);

      expect(
        response.body.every((account: any) => account.isActive === true),
      ).toBe(true);
    });

    it("should search accounts by name", async () => {
      const response = await request(app)
        .get("/api/accounts")
        .query({ search: "Corrente" })
        .set(authHeaders)
        .expect(200);

      expect(
        response.body.some((account: any) => account.name.includes("Corrente")),
      ).toBe(true);
    });

    it("should return 401 for unauthenticated request", async () => {
      await request(app).get("/api/accounts").expect(401);
    });
  });

  describe("GET /api/accounts/:id", () => {
    it("should return account details with balance", async () => {
      const accountId = testData.accounts.checking.id;

      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        id: accountId,
        name: "Conta Corrente",
        code: "CHECKING",
        type: "asset",
        subtype: "current_asset",
        balance: expect.any(Number),
        isActive: true,
        ledger: expect.objectContaining({
          name: "Ativos",
          type: "asset",
        }),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should return 404 for non-existent account", async () => {
      await request(app)
        .get("/api/accounts/non-existent-id")
        .set(authHeaders)
        .expect(404);
    });

    it("should return 403 for cross-tenant access", async () => {
      // Criar conta em outro tenant
      const otherTenant = await prisma.tenant.create({
        data: {
          id: "other_tenant_account",
          name: "Other Tenant",
          domain: "other.com",
          settings: {},
          isActive: true,
        },
      });

      const otherLedger = await prisma.ledger.create({
        data: {
          id: "ledger_other_tenant",
          tenantId: otherTenant.id,
          name: "Other Ledger",
          code: "OTHER",
          type: "asset",
          description: "Ledger for other tenant",
        },
      });

      const otherAccount = await prisma.account.create({
        data: {
          id: "acc_other_tenant",
          tenantId: otherTenant.id,
          ledgerId: otherLedger.id,
          name: "Other Account",
          code: "OTHER_ACC",
          type: "asset",
          subtype: "current_asset",
          description: "Account for other tenant",
          isActive: true,
        },
      });

      await request(app)
        .get(`/api/accounts/${otherAccount.id}`)
        .set(authHeaders)
        .expect(403);
    });
  });

  describe("POST /api/accounts", () => {
    it("should create new account successfully", async () => {
      const accountData = {
        tenantId: testData.tenant.id,
        ledgerId: testData.ledgers.assets.id,
        name: "Nova Conta Bancária",
        code: "NEW_BANK",
        type: "asset",
        subtype: "current_asset",
        description: "Conta bancária criada via API",
        metadata: {
          bank: "Banco do Brasil",
          agency: "1234",
          account: "56789-0",
        },
      };

      const response = await request(app)
        .post("/api/accounts")
        .set(authHeaders)
        .send(accountData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: "Nova Conta Bancária",
        code: "NEW_BANK",
        type: "asset",
        subtype: "current_asset",
        description: "Conta bancária criada via API",
        balance: 0,
        isActive: true,
        metadata: {
          bank: "Banco do Brasil",
          agency: "1234",
          account: "56789-0",
        },
        ledger: expect.objectContaining({
          id: testData.ledgers.assets.id,
        }),
        createdAt: expect.any(String),
      });

      // Verificar se foi criada no banco
      const createdAccount = await prisma.account.findUnique({
        where: { id: response.body.id },
      });

      expect(createdAccount).toBeTruthy();
      expect(createdAccount?.tenantId).toBe(testData.tenant.id);
    });

    it("should return 400 for duplicate account code", async () => {
      const accountData = {
        tenantId: testData.tenant.id,
        ledgerId: testData.ledgers.assets.id,
        name: "Conta Duplicada",
        code: "CHECKING", // Código já existe
        type: "asset",
        subtype: "current_asset",
        description: "Conta com código duplicado",
      };

      const response = await request(app)
        .post("/api/accounts")
        .set(authHeaders)
        .send(accountData)
        .expect(400);

      expect(response.body.error).toContain("código já existe");
    });

    it("should return 400 for invalid account type", async () => {
      const accountData = {
        tenantId: testData.tenant.id,
        ledgerId: testData.ledgers.assets.id,
        name: "Conta Inválida",
        code: "INVALID",
        type: "invalid_type", // Tipo inválido
        subtype: "current_asset",
        description: "Conta com tipo inválido",
      };

      const response = await request(app)
        .post("/api/accounts")
        .set(authHeaders)
        .send(accountData)
        .expect(400);

      expect(response.body.error).toContain("tipo de conta inválido");
    });

    it("should return 400 for non-existent ledger", async () => {
      const accountData = {
        tenantId: testData.tenant.id,
        ledgerId: "non-existent-ledger",
        name: "Conta Órfã",
        code: "ORPHAN",
        type: "asset",
        subtype: "current_asset",
        description: "Conta sem ledger",
      };

      const response = await request(app)
        .post("/api/accounts")
        .set(authHeaders)
        .send(accountData)
        .expect(400);

      expect(response.body.error).toContain("ledger não encontrado");
    });

    it("should return 401 for unauthenticated request", async () => {
      const accountData = {
        tenantId: testData.tenant.id,
        ledgerId: testData.ledgers.assets.id,
        name: "Conta Não Autorizada",
        code: "UNAUTH",
        type: "asset",
        subtype: "current_asset",
      };

      await request(app).post("/api/accounts").send(accountData).expect(401);
    });
  });

  describe("PUT /api/accounts/:id", () => {
    let accountId: string;

    beforeEach(async () => {
      const account = await prisma.account.create({
        data: {
          id: "acc_update_test",
          tenantId: testData.tenant.id,
          ledgerId: testData.ledgers.assets.id,
          name: "Conta Original",
          code: "ORIGINAL",
          type: "asset",
          subtype: "current_asset",
          description: "Conta para teste de atualização",
          isActive: true,
          metadata: { original: true },
        },
      });
      accountId = account.id;
    });

    it("should update account successfully", async () => {
      const updateData = {
        name: "Conta Atualizada",
        description: "Descrição atualizada via API",
        metadata: {
          updated: true,
          version: 2,
          bank: "Novo Banco",
        },
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: accountId,
        name: "Conta Atualizada",
        code: "ORIGINAL", // Código não deve mudar
        description: "Descrição atualizada via API",
        metadata: {
          updated: true,
          version: 2,
          bank: "Novo Banco",
        },
        updatedAt: expect.any(String),
      });

      // Verificar se foi atualizada no banco
      const updatedAccount = await prisma.account.findUnique({
        where: { id: accountId },
      });

      expect(updatedAccount?.name).toBe("Conta Atualizada");
      expect(updatedAccount?.description).toBe("Descrição atualizada via API");
    });

    it("should not allow updating account code", async () => {
      const updateData = {
        code: "NEW_CODE", // Tentativa de alterar código
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toContain(
        "código da conta não pode ser alterado",
      );
    });

    it("should not allow updating account type", async () => {
      const updateData = {
        type: "liability", // Tentativa de alterar tipo
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toContain(
        "tipo da conta não pode ser alterado",
      );
    });

    it("should toggle account active status", async () => {
      const updateData = {
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .send(updateData)
        .expect(200);

      expect(response.body.isActive).toBe(false);

      // Verificar no banco
      const updatedAccount = await prisma.account.findUnique({
        where: { id: accountId },
      });

      expect(updatedAccount?.isActive).toBe(false);
    });

    it("should return 404 for non-existent account", async () => {
      await request(app)
        .put("/api/accounts/non-existent-id")
        .set(authHeaders)
        .send({ name: "Updated" })
        .expect(404);
    });
  });

  describe("DELETE /api/accounts/:id", () => {
    let accountId: string;

    beforeEach(async () => {
      const account = await prisma.account.create({
        data: {
          id: "acc_delete_test",
          tenantId: testData.tenant.id,
          ledgerId: testData.ledgers.assets.id,
          name: "Conta para Deletar",
          code: "DELETE_TEST",
          type: "asset",
          subtype: "current_asset",
          description: "Conta para teste de exclusão",
          isActive: true,
        },
      });
      accountId = account.id;
    });

    it("should deactivate account instead of deleting", async () => {
      await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .expect(204);

      // Verificar se a conta foi desativada, não deletada
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      expect(account).toBeTruthy();
      expect(account?.isActive).toBe(false);
    });

    it("should not allow deleting account with transactions", async () => {
      // Criar transação para a conta
      const transaction = await prisma.transaction.create({
        data: {
          id: "txn_with_account",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(100),
          description: "Transaction with account",
          status: "processed",
          date: new Date(),
          tags: [],
          metadata: {},
        },
      });

      // Criar entrada para a conta
      await prisma.entry.create({
        data: {
          id: "entry_with_account",
          tenantId: testData.tenant.id,
          transactionId: transaction.id,
          accountId: accountId,
          type: "debit",
          amount: new Prisma.Decimal(100),
          description: "Entry for account",
        },
      });

      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set(authHeaders)
        .expect(400);

      expect(response.body.error).toContain("possui transações");

      // Verificar que a conta ainda está ativa
      const account = await prisma.account.findUnique({
        where: { id: accountId },
      });

      expect(account?.isActive).toBe(true);
    });

    it("should return 404 for non-existent account", async () => {
      await request(app)
        .delete("/api/accounts/non-existent-id")
        .set(authHeaders)
        .expect(404);
    });
  });

  describe("GET /api/accounts/:id/balance", () => {
    let accountId: string;

    beforeEach(async () => {
      accountId = testData.accounts.checking.id;

      // Criar algumas transações para testar o cálculo de saldo
      const transaction1 = await prisma.transaction.create({
        data: {
          id: "txn_balance_1",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(100),
          description: "Balance test 1",
          status: "processed",
          date: new Date("2024-01-15"),
          tags: [],
          metadata: {},
        },
      });

      const transaction2 = await prisma.transaction.create({
        data: {
          id: "txn_balance_2",
          tenantId: testData.tenant.id,
          userId: testData.user.id,
          categoryId: testData.category.id,
          type: "expense",
          amount: new Prisma.Decimal(50),
          description: "Balance test 2",
          status: "processed",
          date: new Date("2024-01-16"),
          tags: [],
          metadata: {},
        },
      });

      // Criar entradas para as transações
      await prisma.entry.createMany({
        data: [
          {
            id: "entry_balance_1_credit",
            tenantId: testData.tenant.id,
            transactionId: transaction1.id,
            accountId: accountId,
            type: "credit",
            amount: new Prisma.Decimal(100),
            description: "Credit entry 1",
          },
          {
            id: "entry_balance_2_credit",
            tenantId: testData.tenant.id,
            transactionId: transaction2.id,
            accountId: accountId,
            type: "credit",
            amount: new Prisma.Decimal(50),
            description: "Credit entry 2",
          },
        ],
      });
    });

    it("should return current account balance", async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}/balance`)
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId: accountId,
        balance: expect.any(Number),
        currency: "BRL",
        lastUpdated: expect.any(String),
      });

      // Para conta de ativo, créditos diminuem o saldo
      expect(response.body.balance).toBe(-150); // -100 - 50
    });

    it("should return balance for specific date", async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}/balance`)
        .query({ date: "2024-01-15T23:59:59Z" })
        .set(authHeaders)
        .expect(200);

      // Apenas a primeira transação deve ser considerada
      expect(response.body.balance).toBe(-100);
    });

    it("should return balance history", async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}/balance`)
        .query({
          startDate: "2024-01-01T00:00:00Z",
          endDate: "2024-01-31T23:59:59Z",
          includeHistory: "true",
        })
        .set(authHeaders)
        .expect(200);

      expect(response.body).toMatchObject({
        accountId: accountId,
        balance: -150,
        history: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            balance: expect.any(Number),
            change: expect.any(Number),
          }),
        ]),
      });

      expect(response.body.history.length).toBeGreaterThan(0);
    });

    it("should return 404 for non-existent account", async () => {
      await request(app)
        .get("/api/accounts/non-existent-id/balance")
        .set(authHeaders)
        .expect(404);
    });
  });
});
