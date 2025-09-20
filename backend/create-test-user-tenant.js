const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Criando associação UserTenant para usuário de teste...');
    
    // Buscar o tenant existente
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('Nenhum tenant encontrado');
      return;
    }
    
    console.log('Tenant encontrado:', tenant.id);
    
    // Buscar o usuário de teste
    const user = await prisma.user.findUnique({
      where: { email: 'teste@exemplo.com' }
    });
    
    if (!user) {
      console.error('Usuário teste@exemplo.com não encontrado');
      return;
    }
    
    console.log('Usuário encontrado:', user.id);
    
    // Criar associação UserTenant para o usuário de teste
    const userTenant = await prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id
        }
      },
      update: {
        isActive: true,
        role: 'USER'
      },
      create: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'USER',
        isActive: true
      }
    });
    
    console.log('UserTenant criado/atualizado:', userTenant);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();