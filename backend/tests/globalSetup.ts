import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

module.exports = async () => {
  console.log("🚀 Setting up test environment...");

  // Configurar variáveis de ambiente para testes
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.DATABASE_URL_TEST ||
    "postgresql://test:test@localhost:5432/suagrana_test";
  process.env.JWT_SECRET = "test-secret-key";
  process.env.REDIS_URL = "redis://localhost:6379/1";

  try {
    // Executar migrações do Prisma para o banco de teste
    console.log("📦 Running database migrations...");
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });

    // Gerar cliente Prisma
    console.log("🔧 Generating Prisma client...");
    execSync("npx prisma generate", {
      stdio: "inherit",
    });

    // Verificar conexão com o banco
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    await prisma.$connect();
    console.log("✅ Database connection established");
    await prisma.$disconnect();

    console.log("✅ Test environment setup complete!");
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error);
    process.exit(1);
  }
};
