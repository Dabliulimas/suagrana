const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    const user = await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword
      }
    });
    
    console.log('✅ Usuário de teste criado:', user);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Usuário de teste já existe');
    } else {
      console.error('❌ Erro ao criar usuário:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();