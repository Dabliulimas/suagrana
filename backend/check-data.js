const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('Verificando dados no banco...');
    
    // Verificar usuários
    const users = await prisma.user.findMany();
    console.log(`Usuários encontrados: ${users.length}`);
    
    // Verificar contas
    const accounts = await prisma.account.findMany();
    console.log(`Contas encontradas: ${accounts.length}`);
    
    // Verificar transações
    const transactions = await prisma.transaction.findMany();
    console.log(`Transações encontradas: ${transactions.length}`);
    
    // Verificar categorias
    const categories = await prisma.category.findMany();
    console.log(`Categorias encontradas: ${categories.length}`);
    
    if (users.length > 0) {
      console.log('\nPrimeiro usuário:', users[0]);
    }
    
    if (transactions.length > 0) {
      console.log('\nPrimeiras 3 transações:');
      transactions.slice(0, 3).forEach((t, i) => {
        console.log(`${i + 1}:`, {
          id: t.id,
          description: t.description,
          amount: t.amount,
          type: t.type,
          date: t.date
        });
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();