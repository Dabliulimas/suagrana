import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTransactions() {
  try {
    console.log('🔍 Verificando transações no banco de dados...\n');
    
    // Verificar usuários
    const users = await prisma.user.findMany();
    console.log(`👥 Usuários encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    
    // Verificar contas
    const accounts = await prisma.account.findMany();
    console.log(`\n💳 Contas encontradas: ${accounts.length}`);
    accounts.forEach(account => {
      console.log(`  - ${account.name} (${account.type}) - Saldo: R$ ${account.balance}`);
    });
    
    // Verificar transações
    const transactions = await prisma.transaction.findMany({
      include: {
        user: true,
        account: true,
        categoryRef: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`\n💰 Transações encontradas: ${transactions.length}`);
    
    if (transactions.length > 0) {
      console.log('\n📋 Últimas transações:');
      transactions.slice(0, 10).forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.description}`);
        console.log(`     Valor: R$ ${transaction.amount}`);
        console.log(`     Tipo: ${transaction.type}`);
        console.log(`     Data: ${transaction.date}`);
        console.log(`     Usuário: ${transaction.user?.name || 'N/A'}`);
        console.log(`     Conta: ${transaction.account?.name || 'N/A'}`);
        console.log(`     Categoria: ${transaction.categoryRef?.name || transaction.category || 'N/A'}`);
        console.log('     ---');
      });
    } else {
      console.log('❌ Nenhuma transação encontrada no banco!');
    }
    
    // Verificar categorias
    const categories = await prisma.category.findMany();
    console.log(`\n🏷️ Categorias encontradas: ${categories.length}`);
    categories.forEach(category => {
      console.log(`  - ${category.name} (${category.type})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();