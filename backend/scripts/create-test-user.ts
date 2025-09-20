import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { id: 'test-user-1' }
    });
    
    if (existingUser) {
      console.log('✅ Usuário de teste já existe:', existingUser.email);
      return existingUser;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Usuário Teste',
        password: hashedPassword,
        isActive: true,
      }
    });
    
    console.log('✅ Usuário de teste criado com sucesso:', user.email);
    
    // Criar tenant de teste
    const tenant = await prisma.tenant.create({
      data: {
        id: 'test-tenant-1',
        name: 'Tenant Teste',
        slug: 'test-tenant',
        isActive: true,
      }
    });
    
    console.log('✅ Tenant de teste criado:', tenant.name);
    
    // Associar usuário ao tenant
    await prisma.userTenant.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'OWNER',
        isActive: true,
      }
    });
    
    console.log('✅ Usuário associado ao tenant com sucesso');
    
    return user;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestUser()
    .then(() => {
      console.log('🎉 Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro no script:', error);
      process.exit(1);
    });
}

export { createTestUser };