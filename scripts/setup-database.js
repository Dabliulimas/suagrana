const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log("🚀 Configurando banco de dados...");

  try {
    // Criar usuário padrão
    const user = await prisma.user.upsert({
      where: { email: "user@example.com" },
      update: {},
      create: {
        id: "user_1",
        email: "user@example.com",
        name: "Usuário Padrão",
      },
    });

    console.log("✅ Usuário criado:", user.name);

    // Criar contas padrão
    const accounts = [
      {
        userId: user.id,
        name: "Conta Corrente",
        type: "checking",
        balance: 0,
        description: "Conta corrente principal",
      },
      {
        userId: user.id,
        name: "Poupança",
        type: "savings",
        balance: 0,
        description: "Conta poupança",
      },
      {
        userId: user.id,
        name: "Cartão de Crédito",
        type: "credit",
        balance: 0,
        description: "Cartão de crédito principal",
      },
    ];

    for (const accountData of accounts) {
      const account = await prisma.account.upsert({
        where: {
          userId_name: {
            userId: accountData.userId,
            name: accountData.name,
          },
        },
        update: {},
        create: accountData,
      });
      console.log("✅ Conta criada:", account.name);
    }

    // Criar algumas transações de exemplo
    const checkingAccount = await prisma.account.findFirst({
      where: { name: "Conta Corrente", userId: user.id },
    });

    if (checkingAccount) {
      const sampleTransactions = [
        {
          userId: user.id,
          accountId: checkingAccount.id,
          description: "Salário",
          amount: 5000,
          type: "income",
          category: "Salário",
          date: new Date(),
          notes: "Salário mensal",
        },
        {
          userId: user.id,
          accountId: checkingAccount.id,
          description: "Supermercado",
          amount: 350,
          type: "expense",
          category: "Alimentação",
          date: new Date(),
          notes: "Compras do mês",
        },
        {
          userId: user.id,
          accountId: checkingAccount.id,
          description: "Combustível",
          amount: 200,
          type: "expense",
          category: "Transporte",
          date: new Date(),
        },
      ];

      for (const transactionData of sampleTransactions) {
        const transaction = await prisma.transaction.create({
          data: transactionData,
        });

        // Atualizar saldo da conta
        const balanceChange =
          transaction.type === "income"
            ? transaction.amount
            : -transaction.amount;
        await prisma.account.update({
          where: { id: checkingAccount.id },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        console.log("✅ Transação criada:", transaction.description);
      }
    }

    // Criar algumas metas de exemplo
    const sampleGoals = [
      {
        userId: user.id,
        name: "Reserva de Emergência",
        description: "Meta para reserva de emergência de 6 meses",
        targetAmount: 30000,
        currentAmount: 5000,
        category: "Emergência",
        priority: "high",
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      },
      {
        userId: user.id,
        name: "Viagem para Europa",
        description: "Economizar para viagem dos sonhos",
        targetAmount: 15000,
        currentAmount: 2000,
        category: "Lazer",
        priority: "medium",
        targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 meses
      },
    ];

    for (const goalData of sampleGoals) {
      const goal = await prisma.goal.create({
        data: goalData,
      });
      console.log("✅ Meta criada:", goal.name);
    }

    console.log("🎉 Banco de dados configurado com sucesso!");
    console.log("");
    console.log("📊 Dados criados:");
    console.log("- 1 usuário padrão");
    console.log("- 3 contas (Corrente, Poupança, Cartão)");
    console.log("- 3 transações de exemplo");
    console.log("- 2 metas financeiras");
    console.log("");
    console.log("🚀 Agora você pode iniciar o sistema:");
    console.log("npm run dev:port");
  } catch (error) {
    console.error("❌ Erro ao configurar banco de dados:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
