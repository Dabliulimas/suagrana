const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleTransaction() {
  try {
    console.log('🔍 Testando transação simples...');
    
    const result = await prisma.$transaction(async (tx) => {
      console.log('📝 Dentro da transação...');
      
      // Operação simples dentro da transação
      const accounts = await tx.account.findMany({
        take: 1
      });
      
      console.log('✅ Consulta dentro da transação funcionou:', accounts.length);
      
      return { success: true, accountsFound: accounts.length };
    }, {
      timeout: 15000 // 15 segundos
    });
    
    console.log('✅ Transação simples concluída:', result);
    
  } catch (error) {
    console.error('❌ Erro na transação simples:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleTransaction();