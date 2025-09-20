import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const FRONTEND_URL = 'http://localhost:3000';

const testUser = {
  name: 'Usuário Teste',
  email: 'teste@exemplo.com',
  password: 'Teste123!'
};

async function createTestUserWithTenant() {
  try {
    console.log('🏢 Criando tenant de teste...');
    
    // Verificar se o tenant já existe
    let tenant = await prisma.tenant.findUnique({
      where: { slug: 'teste' }
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Tenant Teste',
          slug: 'teste',
          settings: JSON.stringify({
            currency: 'BRL',
            timezone: 'America/Sao_Paulo',
            dateFormat: 'DD/MM/YYYY',
          }),
          isActive: true,
        },
      });
      console.log('✅ Tenant criado:', tenant.id);
    } else {
      console.log('✅ Tenant já existe:', tenant.id);
    }

    console.log('👤 Criando usuário de teste...');
    
    // Verificar se o usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      user = await prisma.user.create({
        data: {
          email: testUser.email,
          name: testUser.name,
          password: hashedPassword,
          isActive: true,
        },
      });
      console.log('✅ Usuário criado:', user.id);
    } else {
      console.log('✅ Usuário já existe:', user.id);
    }

    console.log('🔗 Associando usuário ao tenant...');
    
    // Verificar se a associação já existe
    let userTenant = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: user.id,
          tenantId: tenant.id
        }
      }
    });

    if (!userTenant) {
      userTenant = await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'OWNER',
          isActive: true,
        },
      });
      console.log('✅ Associação criada:', userTenant.id);
    } else {
      console.log('✅ Associação já existe:', userTenant.id);
    }

    console.log('🧪 Testando login...');
    await testLogin();

  } catch (error) {
    console.error('❌ Erro ao criar usuário com tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testLogin() {
  try {
    const response = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });

    const data = await response.json();
    console.log('📊 Status do login:', response.status);
    
    if (response.ok) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🎫 Token recebido:', data.data?.accessToken ? 'Sim' : 'Não');
      
      if (data.data?.accessToken) {
        console.log('🧪 Testando acesso à rota protegida...');
        await testProtectedRoute(data.data.accessToken);
      }
    } else {
      console.log('❌ Erro no login:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao testar login:', error);
  }
}

async function testProtectedRoute(token) {
  try {
    const response = await fetch(`${FRONTEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📊 Status da rota protegida:', response.status);
    
    if (response.ok) {
      console.log('✅ Acesso à rota protegida autorizado!');
      console.log('👤 Dados do usuário:', {
        id: data.data?.id,
        name: data.data?.name,
        email: data.data?.email
      });
    } else {
      console.log('❌ Erro na rota protegida:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao testar rota protegida:', error);
  }
}

// Executar o script
createTestUserWithTenant();