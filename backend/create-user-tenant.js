const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Criando associação UserTenant...');
    
    // Buscar o tenant existente
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.error('Nenhum tenant encontrado');
      return;
    }
    
    console.log('Tenant encontrado:', tenant.id);
    
    // Criar associação UserTenant para o usuário de teste
    const userTenant = await prisma.userTenant.upsert({
      where: {
        userId_tenantId: {
          userId: 'test-user-id',
          tenantId: tenant.id
        }
      },
      update: {
        isActive: true
      },
      create: {
        userId: 'test-user-id',
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