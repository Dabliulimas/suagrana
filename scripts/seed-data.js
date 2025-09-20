const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Criando dados de exemplo...");

  // Limpar dados existentes
  await prisma.transaction.deleteMany({ where: { userId: "user_1" } });
  await prisma.account.deleteMany({ where: { userId: "user_1" } });
  await prisma.goal.deleteMany({ where: { userId: "user_1" } });
  await prisma.investment.deleteMany({ where: { userId: "user_1" } });
  await prisma.contact.deleteMany({ where: { userId: "user_1" } });
  await prisma.user.deleteMany({ where: { id: "user_1" } });

  // Criar usuário
  await prisma.user.create({
    data: {
      id: "user_1",
      email: "usuario@exemplo.com",
      name: "Usuário Exemplo",
      avatar: null,
    },
  });

  console.log("✅ Usuário criado");

  // Criar contas
  const conta1 = await prisma.account.create({
    data: {
      userId: "user_1",
      name: "Conta Corrente Nubank",
      type: "checking",
      balance: 5000.0,
      description: "Conta principal para movimentações diárias",
    },
  });

  const conta2 = await prisma.account.create({
    data: {
      userId: "user_1",
      name: "Poupança Caixa",
      type: "savings",
      balance: 15000.0,
      description: "Reserva de emergência",
    },
  });

  const conta3 = await prisma.account.create({
    data: {
      userId: "user_1",
      name: "Cartão de Crédito",
      type: "credit",
      balance: -1200.0,
      description: "Cartão Nubank",
    },
  });

  console.log("✅ Contas criadas");

  // Criar transações de exemplo
  const transacoes = [
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Salário",
      amount: 8000.0,
      type: "income",
      category: "Salário",
      date: new Date("2025-01-01"),
      notes: "Salário mensal",
    },
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Freelance",
      amount: 2500.0,
      type: "income",
      category: "Freelance",
      date: new Date("2025-01-15"),
      notes: "Projeto extra",
    },
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Supermercado",
      amount: 450.0,
      type: "expense",
      category: "Alimentação",
      date: new Date("2025-01-02"),
      notes: "Compras da semana",
    },
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Aluguel",
      amount: 1800.0,
      type: "expense",
      category: "Moradia",
      date: new Date("2025-01-05"),
      notes: "Aluguel mensal",
    },
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Conta de luz",
      amount: 180.0,
      type: "expense",
      category: "Utilidades",
      date: new Date("2025-01-10"),
      notes: "Energia elétrica",
    },
    {
      userId: "user_1",
      accountId: conta1.id,
      description: "Gasolina",
      amount: 250.0,
      type: "expense",
      category: "Transporte",
      date: new Date("2025-01-12"),
      notes: "Abastecimento",
    },
    {
      userId: "user_1",
      accountId: conta3.id,
      description: "Restaurante",
      amount: 120.0,
      type: "expense",
      category: "Alimentação",
      date: new Date("2025-01-18"),
      notes: "Jantar em família",
    },
  ];

  for (const transacao of transacoes) {
    await prisma.transaction.create({ data: transacao });
  }

  console.log("✅ Transações criadas");

  // Criar metas
  await prisma.goal.create({
    data: {
      userId: "user_1",
      name: "Reserva de Emergência",
      description: "Guardar 6 meses de gastos",
      targetAmount: 30000.0,
      currentAmount: 15000.0,
      category: "Emergência",
      priority: "high",
      status: "active",
      targetDate: new Date("2025-12-31"),
    },
  });

  await prisma.goal.create({
    data: {
      userId: "user_1",
      name: "Viagem para Europa",
      description: "Férias em família",
      targetAmount: 25000.0,
      currentAmount: 5000.0,
      category: "Viagem",
      priority: "medium",
      status: "active",
      targetDate: new Date("2025-07-01"),
    },
  });

  console.log("✅ Metas criadas");

  // Criar investimentos
  await prisma.investment.create({
    data: {
      userId: "user_1",
      name: "Tesouro Selic 2029",
      type: "treasury",
      symbol: "SELIC2029",
      quantity: 10,
      purchasePrice: 100.0,
      currentPrice: 105.5,
      purchaseDate: new Date("2024-06-01"),
      broker: "Rico",
      fees: 0.25,
      notes: "Investimento conservador",
    },
  });

  await prisma.investment.create({
    data: {
      userId: "user_1",
      name: "ITSA4",
      type: "stock",
      symbol: "ITSA4",
      quantity: 100,
      purchasePrice: 9.5,
      currentPrice: 10.2,
      purchaseDate: new Date("2024-08-15"),
      broker: "Clear",
      fees: 2.5,
      notes: "Ação do Itaú",
    },
  });

  console.log("✅ Investimentos criados");

  // Criar contatos
  await prisma.contact.create({
    data: {
      userId: "user_1",
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      category: "Família",
      notes: "Irmão",
    },
  });

  console.log("✅ Contatos criados");

  console.log("🎉 Dados de exemplo criados com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
