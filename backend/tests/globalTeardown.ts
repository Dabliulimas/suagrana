import { PrismaClient } from "@prisma/client";

module.exports = async () => {
  console.log("🧹 Cleaning up test environment...");

  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL_TEST ||
            "postgresql://test:test@localhost:5432/suagrana_test",
        },
      },
    });

    // Limpar todas as tabelas do banco de teste
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>(
      `SELECT tablename FROM pg_tables WHERE schemaname='public'`,
    );

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== "_prisma_migrations")
      .map((name) => `"public"."${name}"`)
      .join(", ");

    if (tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      console.log("🗑️ Database tables cleaned");
    }

    await prisma.$disconnect();
    console.log("✅ Test environment cleanup complete!");
  } catch (error) {
    console.error("❌ Failed to cleanup test environment:", error);
  }
};
