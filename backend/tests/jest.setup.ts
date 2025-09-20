import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./test.db";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.REDIS_URL = "redis://localhost:6379";

// Mock do Redis para testes
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    flushall: jest.fn().mockResolvedValue("OK"),
    quit: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
  }));
});

// Configurar banco de dados de teste
const setupTestDatabase = async () => {
  try {
    // Remover banco de teste anterior se existir
    const testDbPath = path.join(__dirname, "..", "test.db");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Executar migrações usando schema de teste
    execSync("npx prisma migrate deploy --schema=prisma/schema.test.prisma", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: "file:./test.db" },
    });

    // Gerar cliente Prisma para testes
    execSync("npx prisma generate --schema=prisma/schema.test.prisma", {
      stdio: "inherit",
    });

    console.log("✅ Test database setup completed");
  } catch (error) {
    console.error("❌ Failed to setup test database:", error);
    throw error;
  }
};

// Limpar banco de dados após testes
const cleanupTestDatabase = async () => {
  try {
    const testDbPath = path.join(__dirname, "..", "test.db");
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    console.log("✅ Test database cleanup completed");
  } catch (error) {
    console.error("❌ Failed to cleanup test database:", error);
  }
};

// Configurar Jest
beforeAll(async () => {
  await setupTestDatabase();
}, 30000);

afterAll(async () => {
  await cleanupTestDatabase();
}, 10000);

// Mock do console para testes silenciosos
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = originalConsole.error; // Manter erros visíveis
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

export { setupTestDatabase, cleanupTestDatabase };
