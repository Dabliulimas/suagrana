import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

faker.seed(123);

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  console.log("🧹 Limpando dados existentes...");
  await prisma.goal.deleteMany();
  await prisma.dividend.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userTenant.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Criar tenant
  console.log("🏢 Criando tenant...");
  const tenant = await prisma.tenant.create({
    data: {
      id: "demo-tenant-1",
      name: "SuaGrana Demo",
      slug: "demo",
      settings: JSON.stringify({
        currency: "BRL",
        timezone: "America/Sao_Paulo",
        dateFormat: "DD/MM/YYYY",
      }),
      isActive: true,
    },
  });

  // Criar usuário principal
  console.log("👤 Criando usuário principal...");
  const hashedPassword = await bcrypt.hash("Demo123!", 12);
  const mainUser = await prisma.user.create({
    data: {
      id: "demo-user-1",
      email: "demo@suagrana.com",
      name: "Usuário Demo",
      password: hashedPassword,
      isActive: true,
    },
  });

  // Associar usuário ao tenant
  await prisma.userTenant.create({
    data: {
      userId: mainUser.id,
      tenantId: tenant.id,
      role: "OWNER",
      isActive: true,
    },
  });

  // Criar usuários adicionais
  console.log("👥 Criando usuários adicionais...");
  const users = [mainUser];
  for (let i = 0; i < 4; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: "$2a$10$example.hash",
        isActive: true,
      },
    });

    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "USER",
        isActive: true,
      },
    });

    users.push(user);
  }

  // Criar categorias
  console.log("📂 Criando categorias...");
  const categoryData = [
    { name: "Alimentação", type: "EXPENSE" },
    { name: "Transporte", type: "EXPENSE" },
    { name: "Moradia", type: "EXPENSE" },
    { name: "Saúde", type: "EXPENSE" },
    { name: "Educação", type: "EXPENSE" },
    { name: "Lazer", type: "EXPENSE" },
    { name: "Salário", type: "INCOME" },
    { name: "Freelance", type: "INCOME" },
    { name: "Investimentos", type: "INCOME" },
    { name: "Outros", type: "EXPENSE" },
  ];

  const categories = [];
  for (const cat of categoryData) {
    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: cat.name,
        type: cat.type,
        isActive: true,
      },
    });
    categories.push(category);
  }

  // Criar contas
  console.log("🏦 Criando contas...");
  const accountData = [
    { name: "Conta Corrente", type: "ASSET", subtype: "CHECKING" },
    { name: "Conta Poupança", type: "ASSET", subtype: "SAVINGS" },
    { name: "Cartão de Crédito", type: "LIABILITY", subtype: "CREDIT_CARD" },
    { name: "Investimentos", type: "ASSET", subtype: "INVESTMENT" },
  ];

  const accounts = [];
  for (const acc of accountData) {
    const account = await prisma.account.create({
      data: {
        tenantId: tenant.id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        isActive: true,
      },
    });
    accounts.push(account);
  }

  // Criar transações
  console.log("💰 Criando transações...");
  for (let i = 0; i < 100; i++) {
    const isIncome = faker.datatype.boolean(0.3); // 30% chance de ser receita
    const category =
      categories.find((c) => c.type === (isIncome ? "INCOME" : "EXPENSE")) ||
      categories[0];

    const account = faker.helpers.arrayElement(accounts);
    const amount = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
    const date = faker.date.between({
      from: new Date("2024-01-01"),
      to: new Date("2024-12-31"),
    });

    const transaction = await prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        createdBy: faker.helpers.arrayElement(users).id,
        description: faker.lorem.sentence({ min: 3, max: 8 }),
        date: date,
        tags: faker.helpers
          .arrayElements(["tag1", "tag2", "tag3"], { min: 0, max: 2 })
          .join(","),
        metadata: JSON.stringify({
          source: "seed",
          generated: true,
        }),
      },
    });

    // Criar entry para a transação
    await prisma.entry.create({
      data: {
        transactionId: transaction.id,
        accountId: account.id,
        categoryId: category.id,
        debit: isIncome ? 0 : amount,
        credit: isIncome ? amount : 0,
        description: transaction.description,
      },
    });
  }

  // Criar metas financeiras
  console.log("🎯 Criando metas financeiras...");
  const goalData = [
    {
      name: "Reserva de Emergência",
      target: 50000,
      current: 15000,
      category: "EMERGENCY",
    },
    {
      name: "Viagem para Europa",
      target: 20000,
      current: 5000,
      category: "TRAVEL",
    },
    { name: "Carro Novo", target: 80000, current: 25000, category: "VEHICLE" },
    {
      name: "Casa Própria",
      target: 300000,
      current: 50000,
      category: "HOUSING",
    },
  ];

  for (const goal of goalData) {
    await prisma.goal.create({
      data: {
        tenantId: tenant.id,
        userId: faker.helpers.arrayElement(users).id,
        name: goal.name,
        description: `Meta para ${goal.name.toLowerCase()}`,
        targetAmount: goal.target,
        currentAmount: goal.current,
        targetDate: faker.date.future({ years: 2 }),
        category: goal.category,
        priority: "MEDIUM",
        status: "ACTIVE",
      },
    });
  }

  // Criar investimentos
  console.log("📈 Criando investimentos...");
  const investmentData = [
    {
      name: "Tesouro Selic",
      type: "FIXED_INCOME",
      symbol: "SELIC2029",
      quantity: 100,
      price: 105.5,
    },
    {
      name: "CDB Banco XYZ",
      type: "FIXED_INCOME",
      symbol: "CDB_XYZ",
      quantity: 1,
      price: 15000,
    },
    {
      name: "Ações PETR4",
      type: "STOCK",
      symbol: "PETR4",
      quantity: 200,
      price: 25.0,
    },
    {
      name: "Fundo Imobiliário",
      type: "REAL_ESTATE",
      symbol: "HGLG11",
      quantity: 80,
      price: 100.0,
    },
  ];

  for (const inv of investmentData) {
    await prisma.investment.create({
      data: {
        tenantId: tenant.id,
        userId: faker.helpers.arrayElement(users).id,
        name: inv.name,
        type: inv.type,
        symbol: inv.symbol,
        quantity: inv.quantity,
        purchasePrice: inv.price,
        currentPrice: inv.price * faker.number.float({ min: 0.95, max: 1.15 }),
        purchaseDate: faker.date.past({ years: 1 }),
        status: "ACTIVE",
        broker: "Corretora Demo",
        fees: faker.number.float({ min: 0, max: 50 }),
        metadata: JSON.stringify({ source: "seed" }),
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log(`📊 Dados criados:`);
  console.log(`   - 1 tenant`);
  console.log(`   - ${users.length} usuários`);
  console.log(`   - ${categories.length} categorias`);
  console.log(`   - ${accounts.length} contas`);
  console.log(`   - 100 transações`);
  console.log(`   - ${goalData.length} metas financeiras`);
  console.log(`   - ${investmentData.length} investimentos`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
