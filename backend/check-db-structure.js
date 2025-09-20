const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Verificando estrutura do banco de dados...");

    // Verificar tabelas existentes
    const tables =
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log("\n📊 Tabelas encontradas:");
    tables.forEach((table) => {
      console.log(`  - ${table.name}`);
    });

    // Tentar buscar dados das tabelas mais comuns
    console.log("\n📋 Verificando dados...");

    try {
      const transactions =
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`;
      console.log(`  - Transações: ${transactions[0].count}`);
    } catch (e) {
      console.log("  - Transações: tabela não existe");
    }

    try {
      const accounts =
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM accounts`;
      console.log(`  - Contas: ${accounts[0].count}`);
    } catch (e) {
      console.log("  - Contas: tabela não existe");
    }

    try {
      const goals = await prisma.$queryRaw`SELECT COUNT(*) as count FROM goals`;
      console.log(`  - Metas: ${goals[0].count}`);
    } catch (e) {
      console.log("  - Metas: tabela não existe");
    }

    try {
      const investments =
        await prisma.$queryRaw`SELECT COUNT(*) as count FROM investments`;
      console.log(`  - Investimentos: ${investments[0].count}`);
    } catch (e) {
      console.log("  - Investimentos: tabela não existe");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar banco:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
