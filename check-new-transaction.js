import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewTransaction() {
  try {
    console.log('🔍 Buscando transação criada via modal...');
    
    // Buscar transação específica
    const newTransaction = await prisma.transaction.findFirst({
      where: {
        description: 'Teste de transação via modal'
      },
      include: {
        user: true,
        account: true,
        categoryRef: true
      }
    });

    if (newTransaction) {
      console.log('✅ Transação encontrada!');
      console.log(`ID: ${newTransaction.id}`);
      console.log(`Descrição: ${newTransaction.description}`);
      console.log(`Valor: R$ ${newTransaction.amount}`);
      console.log(`Tipo: ${newTransaction.type}`);
      console.log(`Data: ${newTransaction.date}`);
      console.log(`Usuário: ${newTransaction.user?.name || 'N/A'}`);
      console.log(`Conta: ${newTransaction.account?.name || 'N/A'}`);
      console.log(`Categoria: ${newTransaction.categoryRef?.name || newTransaction.category}`);
      console.log(`Observações: ${newTransaction.notes || 'N/A'}`);
    } else {
      console.log('❌ Transação não encontrada');
      
      // Buscar as últimas 5 transações para debug
      console.log('\n📋 Últimas 5 transações:');
      const recentTransactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true,
          account: true,
          categoryRef: true
        }
      });

      recentTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. ${transaction.description}`);
        console.log(`   Valor: R$ ${transaction.amount}`);
        console.log(`   Data criação: ${transaction.createdAt}`);
        console.log(`   ---`);
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar transação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNewTransaction();