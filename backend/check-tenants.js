const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('Verificando tenants...');
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants encontrados:', JSON.stringify(tenants, null, 2));
    
    console.log('\nVerificando userTenants...');
    const userTenants = await prisma.userTenant.findMany();
    console.log('UserTenants encontrados:', JSON.stringify(userTenants, null, 2));
    
    console.log('\nVerificando usuários...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    console.log('Usuários encontrados:', JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
})();