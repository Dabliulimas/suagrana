const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Criar usuário de exemplo
  const user = await prisma.user.upsert({
    where: { email: 'usuario@exemplo.com' },
    update: {},
    create: {
      id: '1',
      email: 'usuario@exemplo.com',
      name: 'Usuário Exemplo',
    },
  });

  // Criar conta de exemplo
  const account = await prisma.account.upsert({
    where: { id: 'account-1' },
    update: {},
    create: {
      id: 'account-1',
      userId: user.id,
      name: 'Conta Corrente',
      type: 'checking',
      balance: 3500.00,
      description: 'Conta principal',
    },
  });

  // Criar transações de exemplo (as mesmas que aparecem no dashboard)
  const transactions = [
    {
      id: 'trans-1',
      userId: user.id,
      accountId: account.id,
      description: 'Salário',
      amount: 5000.00,
      type: 'income',
      category: 'Salário',
      date: new Date('2025-09-15'),
      notes: 'Salário mensal',
    },
    {
      id: 'trans-2',
      userId: user.id,
      accountId: account.id,
      description: 'Supermercado',
      amount: -300.00,
      type: 'expense',
      category: 'Alimentação',
      date: new Date('2025-09-15'),
      notes: 'Compras do mês',
    },
    {
      id: 'trans-3',
      userId: user.id,
      accountId: account.id,
      description: 'Combustível',
      amount: -200.00,
      type: 'expense',
      category: 'Transporte',
      date: new Date('2025-09-15'),
      notes: 'Abastecimento',
    },
    {
      id: 'trans-4',
      userId: user.id,
      accountId: account.id,
      description: 'Investimento',
      amount: -1000.00,
      type: 'expense',
      category: 'Investimentos',
      date: new Date('2025-09-15'),
      notes: 'Aplicação mensal',
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {},
      create: transaction,
    });
  }

  console.log('Dados de exemplo criados com sucesso!');
  console.log(`Usuário: ${user.name} (${user.email})`);
  console.log(`Conta: ${account.name}`);
  console.log(`Transações: ${transactions.length} criadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });