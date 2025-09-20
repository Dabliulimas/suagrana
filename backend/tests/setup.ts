import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { join } from "path";

// Mock do Redis para testes
jest.mock("ioredis", () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Configuração do banco de teste
process.env.DATABASE_URL = "file:./test.db";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.REDIS_URL = "redis://localhost:6379/1";

// Cliente Prisma para testes
const prisma = new PrismaClient();

// Função para limpar o banco de dados
export const cleanDatabase = async () => {
  const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
  `;

  try {
    // Desabilitar foreign keys temporariamente
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF`;

    // Limpar cada tabela
    for (const { name } of tablenames) {
      await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
    }

    // Reabilitar foreign keys
    await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  } catch (error) {
    console.log({ error });
  }
};

// Função para criar dados de teste
export const createTestData = async () => {
  // Criar tenant de teste
  const tenant = await prisma.tenant.create({
    data: {
      id: "tenant_test",
      name: "Test Company",
      domain: "test.com",
      settings: "{}",
      isActive: true,
    },
  });

  // Criar usuário de teste
  const user = await prisma.user.create({
    data: {
      id: "user_test",
      email: "test@test.com",
      name: "Test User",
      password: "$2b$10$test.hash", // Hash de 'password123'
      isActive: true,
    },
  });

  // Criar relação user-tenant
  await prisma.userTenant.create({
    data: {
      id: "ut_test",
      userId: user.id,
      tenantId: tenant.id,
      role: "admin",
      isActive: true,
    },
  });

  // Criar ledgers de teste
  const assetLedger = await prisma.ledger.create({
    data: {
      id: "ledger_assets",
      tenantId: tenant.id,
      name: "Ativo",
      code: "ASSET",
      type: "asset",
      description: "Contas do Ativo",
    },
  });

  const expenseLedger = await prisma.ledger.create({
    data: {
      id: "ledger_expenses",
      tenantId: tenant.id,
      name: "Despesas",
      code: "EXPENSE",
      type: "expense",
      description: "Contas de Despesas",
    },
  });

  // Criar contas de teste
  const checkingAccount = await prisma.account.create({
    data: {
      id: "acc_checking",
      tenantId: tenant.id,
      ledgerId: assetLedger.id,
      name: "Conta Corrente",
      code: "CHECKING",
      type: "asset",
      subtype: "current_asset",
      description: "Conta corrente principal",
      isActive: true,
    },
  });

  const officeExpenseAccount = await prisma.account.create({
    data: {
      id: "acc_office_expense",
      tenantId: tenant.id,
      ledgerId: expenseLedger.id,
      name: "Despesas de Escritório",
      code: "OFFICE_EXP",
      type: "expense",
      subtype: "operating_expense",
      description: "Despesas com material de escritório",
      isActive: true,
    },
  });

  // Criar categoria de teste
  const category = await prisma.category.create({
    data: {
      id: "cat_office",
      tenantId: tenant.id,
      name: "Material de Escritório",
      description: "Gastos com material de escritório",
      color: "#FF6B6B",
      icon: "office",
      type: "expense",
      isActive: true,
    },
  });

  return {
    tenant,
    user,
    accounts: {
      checking: checkingAccount,
      officeExpense: officeExpenseAccount,
    },
    ledgers: {
      assets: assetLedger,
      expenses: expenseLedger,
    },
    category,
  };
};

// Setup global para cada teste
beforeEach(async () => {
  await cleanDatabase();
});

// Cleanup após todos os testes
afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// Exportar instância do Prisma para uso nos testes
export { prisma };

// Tipos para testes
export interface TestContext {
  tenant: any;
  user: any;
  accounts: {
    checking: any;
    officeExpense: any;
  };
  ledgers: {
    assets: any;
    expenses: any;
  };
  category: any;
}

// Helper para criar token JWT de teste
export const createTestToken = (
  userId: string = "user_test",
  tenantId: string = "tenant_test",
) => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    {
      userId,
      email: "test@test.com",
      tenantId,
      role: "admin",
      permissions: ["*"],
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

// Helper para fazer requests autenticados
export const createAuthHeaders = (token?: string) => {
  const authToken = token || createTestToken();
  return {
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  };
};

// Mock de console para testes silenciosos
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
