import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.transaction.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuário padrão
  const user = await prisma.user.create({
    data: {
      id: "user_1",
      email: "usuario@exemplo.com",
      name: "Usuário Exemplo",
      avatar: null,
    },
  });

  console.log("✅ Usuário criado:", user.name);

  // Criar contas
  const contaCorrente = await prisma.account.create({
    data: {
      id: "acc-1",
      userId: user.id,
      name: "Conta Corrente",
      type: "checking",
      balance: new Decimal(15000),
      description: "Conta corrente principal",
    },
  });

  const contaPoupanca = await prisma.account.create({
    data: {
      id: "acc-2",
      userId: user.id,
      name: "Poupança",
      type: "savings",
      balance: new Decimal(25000),
      description: "Conta poupança para emergências",
    },
  });

  const cartaoCredito = await prisma.account.create({
    data: {
      id: "acc-3",
      userId: user.id,
      name: "Cartão de Crédito",
      type: "credit",
      balance: new Decimal(-2500),
      description: "Cartão de crédito principal",
    },
  });

  console.log("✅ Contas criadas:", [
    contaCorrente.name,
    contaPoupanca.name,
    cartaoCredito.name,
  ]);

  // Criar transações dos últimos 3 meses
  const transactions = [
    // Janeiro 2025
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Salário Janeiro",
      amount: new Decimal(5500),
      type: "income",
      category: "Salário",
      date: new Date("2025-01-05"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Supermercado",
      amount: new Decimal(-450),
      type: "expense",
      category: "Alimentação",
      date: new Date("2025-01-08"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Conta de Luz",
      amount: new Decimal(-180),
      type: "expense",
      category: "Utilidades",
      date: new Date("2025-01-10"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Gasolina",
      amount: new Decimal(-200),
      type: "expense",
      category: "Transporte",
      date: new Date("2025-01-12"),
    },
    {
      userId: user.id,
      accountId: contaPoupanca.id,
      description: "Transferência para Poupança",
      amount: new Decimal(1000),
      type: "transfer",
      category: "Transferência",
      date: new Date("2025-01-15"),
    },
    // Fevereiro 2025
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Salário Fevereiro",
      amount: new Decimal(5500),
      type: "income",
      category: "Salário",
      date: new Date("2025-02-05"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Freelance",
      amount: new Decimal(1200),
      type: "income",
      category: "Freelance",
      date: new Date("2025-02-15"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Restaurante",
      amount: new Decimal(-120),
      type: "expense",
      category: "Alimentação",
      date: new Date("2025-02-18"),
    },
    {
      userId: user.id,
      accountId: cartaoCredito.id,
      description: "Compras Online",
      amount: new Decimal(-350),
      type: "expense",
      category: "Compras",
      date: new Date("2025-02-20"),
    },
    // Janeiro 2025 (atual)
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Salário Janeiro",
      amount: new Decimal(5500),
      type: "income",
      category: "Salário",
      date: new Date("2025-01-06"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Supermercado Atacadão",
      amount: new Decimal(-280),
      type: "expense",
      category: "Alimentação",
      date: new Date("2025-01-08"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Netflix",
      amount: new Decimal(-45),
      type: "expense",
      category: "Entretenimento",
      date: new Date("2025-01-10"),
    },
    {
      userId: user.id,
      accountId: contaCorrente.id,
      description: "Uber",
      amount: new Decimal(-35),
      type: "expense",
      category: "Transporte",
      date: new Date("2025-01-12"),
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }

  console.log("✅ Transações criadas:", transactions.length);

  // Criar investimentos
  const investments = [
    {
      userId: user.id,
      name: "Tesouro Selic 2029",
      type: "treasury",
      symbol: "SELIC2029",
      quantity: new Decimal(10),
      purchasePrice: new Decimal(100),
      currentPrice: new Decimal(105.5),
      purchaseDate: new Date("2024-06-15"),
      broker: "Rico",
      fees: new Decimal(0),
      notes: "Investimento conservador",
    },
    {
      userId: user.id,
      name: "ITSA4",
      type: "stock",
      symbol: "ITSA4",
      quantity: new Decimal(100),
      purchasePrice: new Decimal(9.5),
      currentPrice: new Decimal(10.2),
      purchaseDate: new Date("2024-08-20"),
      broker: "XP",
      fees: new Decimal(5),
      notes: "Ação do Itaú",
    },
    {
      userId: user.id,
      name: "HGLG11",
      type: "fii",
      symbol: "HGLG11",
      quantity: new Decimal(50),
      purchasePrice: new Decimal(160),
      currentPrice: new Decimal(165.8),
      purchaseDate: new Date("2024-09-10"),
      broker: "Clear",
      fees: new Decimal(2.5),
      notes: "FII de logística",
    },
  ];

  for (const investment of investments) {
    await prisma.investment.create({ data: investment });
  }

  console.log("✅ Investimentos criados:", investments.length);

  // Criar metas financeiras
  const goals = [
    {
      userId: user.id,
      name: "Reserva de Emergência",
      description: "Acumular 6 meses de gastos",
      targetAmount: new Decimal(30000),
      currentAmount: new Decimal(25000),
      targetDate: new Date("2025-12-31"),
      category: "emergency",
    },
    {
      userId: user.id,
      name: "Viagem Europa",
      description: "Economizar para viagem de férias",
      targetAmount: new Decimal(15000),
      currentAmount: new Decimal(5000),
      targetDate: new Date("2025-07-01"),
      category: "travel",
    },
    {
      userId: user.id,
      name: "Carro Novo",
      description: "Entrada para financiamento",
      targetAmount: new Decimal(20000),
      currentAmount: new Decimal(8000),
      targetDate: new Date("2025-10-01"),
      category: "vehicle",
    },
  ];

  for (const goal of goals) {
    await prisma.goal.create({ data: goal });
  }

  console.log("✅ Metas criadas:", goals.length);

  // Criar contatos
  const contacts = [
    {
      userId: user.id,
      name: "João Silva",
      email: "joao@exemplo.com",
      phone: "(11) 99999-1111",
      category: "family",
    },
    {
      userId: user.id,
      name: "Maria Santos",
      email: "maria@exemplo.com",
      phone: "(11) 99999-2222",
      category: "friend",
    },
    {
      userId: user.id,
      name: "Carlos Oliveira",
      email: "carlos@empresa.com",
      phone: "(11) 99999-3333",
      category: "business",
    },
  ];

  for (const contact of contacts) {
    await prisma.contact.create({ data: contact });
  }

  console.log("✅ Contatos criados:", contacts.length);

  console.log("🎉 Seed concluído com sucesso!");
  console.log("📊 Dados criados:");
  console.log("  - 1 usuário");
  console.log("  - 3 contas");
  console.log(`  - ${transactions.length} transações`);
  console.log(`  - ${investments.length} investimentos`);
  console.log(`  - ${goals.length} metas`);
  console.log(`  - ${contacts.length} contatos`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
