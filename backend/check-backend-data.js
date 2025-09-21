const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBackendData() {
  try {
    console.log('🔍 Verificando dados no SQLite do backend...');
    
    const users = await prisma.user.findMany();
    console.log('👥 Usuários no backend:', users.length);
    
    const transactions = await prisma.transaction.findMany();
    console.log('💰 Transações no backend:', transactions.length);
    
    const accounts = await prisma.account.findMany();
    console.log('🏦 Contas no backend:', accounts.length);
    
    if (transactions.length > 0) {
      console.log('📋 Primeira transação:');
      console.log(JSON.stringify(transactions[0], null, 2));
    }
    
    if (users.length > 0) {
      console.log('👤 Primeiro usuário:');
      console.log(JSON.stringify(users[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBackendData();