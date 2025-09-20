const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("=== VERIFICANDO DADOS NO BANCO ===");

    const transactions = await prisma.transaction.count();
    const accounts = await prisma.account.count();
    const goals = await prisma.goal.count();
    const investments = await prisma.investment.count();

    console.log("Transações:", transactions);
    console.log("Contas:", accounts);
    console.log("Metas:", goals);
    console.log("Investimentos:", investments);

    if (transactions > 0) {
      console.log("\n=== PRIMEIRAS 3 TRANSAÇÕES ===");
      const firstTransactions = await prisma.transaction.findMany({
        take: 3,
        include: {
          account: true,
        },
      });
      firstTransactions.forEach((t, i) => {
        console.log(
          `${i + 1}. ${t.description} - R$ ${t.amount} (${t.type}) - Conta: ${t.account?.name}`,
        );
      });
    }

    if (accounts > 0) {
      console.log("\n=== CONTAS ===");
      const allAccounts = await prisma.account.findMany();
      allAccounts.forEach((acc, i) => {
        console.log(`${i + 1}. ${acc.name} - R$ ${acc.balance} (${acc.type})`);
      });
    }
  } catch (error) {
    console.error("Erro ao verificar banco:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
