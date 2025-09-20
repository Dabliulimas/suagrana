// Script para criar usuário de teste diretamente no backend
const BACKEND_URL = 'http://localhost:3001';

const testUser = {
  name: 'Usuário Teste',
  email: 'test@example.com',
  password: 'Password123!'
};

async function createTestUser() {
  console.log('👤 Criando usuário de teste no backend...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Usuário de teste criado com sucesso');
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Senha:', testUser.password);
      return true;
    } else {
      console.log('❌ Erro ao criar usuário:', data.message);
      console.log('Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testando login...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Login realizado com sucesso');
      console.log('🎫 Token recebido:', data.accessToken ? 'Sim' : 'Não');
      return data.accessToken;
    } else {
      console.log('❌ Erro no login:', data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição de login:', error.message);
    return null;
  }
}

async function main() {
  await createTestUser();
  await testLogin();
}

main().catch(console.error);