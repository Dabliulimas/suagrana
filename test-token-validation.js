const FRONTEND_URL = 'http://localhost:3000';

async function testTokenValidation() {
  try {
    console.log('🔐 Testando validação de token...\n');

    // Primeiro, fazer login para obter um token válido
    console.log('1️⃣ Fazendo login para obter token...');
    const loginResponse = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Falha no login');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.accessToken;
    
    if (!token) {
      console.log('❌ Token não encontrado na resposta');
      return;
    }

    console.log('✅ Token obtido:', token.substring(0, 50) + '...');

    // Testar acesso com token
    console.log('\n2️⃣ Testando acesso com token...');
    const meResponse = await fetch(`${FRONTEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });

    console.log('📊 Status:', meResponse.status);
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ Dados do usuário:', JSON.stringify(userData, null, 2));
    } else {
      const errorData = await meResponse.text();
      console.log('❌ Erro:', errorData);
    }

    // Testar acesso sem token
    console.log('\n3️⃣ Testando acesso sem token...');
    const noTokenResponse = await fetch(`${FRONTEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    console.log('📊 Status sem token:', noTokenResponse.status);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTokenValidation();