const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Teste simples de consulta
    const accounts = await prisma.account.findMany({
      take: 1
    });
    
    console.log('✅ Consulta simples funcionou:', accounts.length, 'contas encontradas');
    
    // Teste de criação simples
    const testAccount = await prisma.account.create({
      data: {
        tenantId: 'dd4bffb8-cec8-4b23-8b52-885737d9134b',
        name: 'Teste Simples',
        type: 'ASSET',
        isActive: true
      }
    });
    
    console.log('✅ Criação simples funcionou:', testAccount.id);
    
    // Limpar teste
    await prisma.account.delete({
      where: { id: testAccount.id }
    });
    
    console.log('✅ Limpeza funcionou');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();