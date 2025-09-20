/**
 * Teste do fluxo completo de autenticação com o serviço centralizado
 */

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';

// Dados de teste
const testUser = {
  name: 'Usuário Teste Auth',
  email: 'teste.auth@exemplo.com',
  password: 'MinhaSenh@123'
};

let authCookies = '';

// Função para fazer requisições com cookies
async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authCookies) {
    headers['Cookie'] = authCookies;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  // Capturar cookies da resposta
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    authCookies = setCookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');
  }

  return response;
}

// Teste 1: Registro de usuário
async function testRegister() {
  console.log('📝 Teste 1: Registro de usuário');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Registro realizado com sucesso');
      console.log('📝 Dados recebidos:', {
        user: data.data?.user?.email,
        hasToken: !!data.data?.accessToken
      });
      return true;
    } else {
      console.log('❌ Erro no registro:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao registrar:', error.message);
    return false;
  }
}

// Teste 2: Login
async function testLogin() {
  console.log('\n🔐 Teste 2: Login');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Login realizado com sucesso');
      console.log('📝 Dados recebidos:', {
        user: data.data?.user?.email,
        hasAccessToken: !!data.data?.accessToken,
        hasRefreshToken: !!data.data?.refreshToken
      });
      return true;
    } else {
      console.log('❌ Erro no login:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao fazer login:', error.message);
    return false;
  }
}

// Teste 3: Acessar rota protegida
async function testProtectedRoute() {
  console.log('\n👤 Teste 3: Acessar rota protegida (/me)');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/me`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Acesso autorizado à rota protegida');
      console.log('📝 Dados do usuário:', {
        id: data.data?.user?.id,
        email: data.data?.user?.email,
        name: data.data?.user?.name
      });
      return true;
    } else {
      console.log('❌ Erro ao acessar rota protegida:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao acessar rota protegida:', error.message);
    return false;
  }
}

// Teste 4: Refresh token
async function testRefreshToken() {
  console.log('\n🔄 Teste 4: Refresh token');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST'
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Refresh token realizado com sucesso');
      console.log('📝 Novos tokens recebidos:', {
        hasAccessToken: !!data.data?.accessToken,
        hasRefreshToken: !!data.data?.refreshToken
      });
      return true;
    } else {
      console.log('❌ Erro no refresh token:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao fazer refresh token:', error.message);
    return false;
  }
}

// Teste 5: Logout
async function testLogout() {
  console.log('\n🚪 Teste 5: Logout');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST'
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Logout realizado com sucesso');
      return true;
    } else {
      console.log('❌ Erro no logout:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao fazer logout:', error.message);
    return false;
  }
}

// Teste 6: Verificar se o acesso foi revogado
async function testAccessRevoked() {
  console.log('\n🔒 Teste 6: Verificar se o acesso foi revogado');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/auth/me`);
    const data = await response.json();
    
    if (response.status === 401 || !data.success) {
      console.log('✅ Acesso corretamente revogado após logout');
      return true;
    } else {
      console.log('❌ Acesso ainda permitido após logout (problema!)');
      return false;
    }
  } catch (error) {
    console.log('✅ Acesso corretamente revogado (erro esperado):', error.message);
    return true;
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🧪 Iniciando testes do fluxo completo de autenticação...\n');
  
  const results = [];
  
  results.push(await testRegister());
  results.push(await testLogin());
  results.push(await testProtectedRoute());
  results.push(await testRefreshToken());
  results.push(await testLogout());
  results.push(await testAccessRevoked());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 Resultados dos testes:');
  console.log(`✅ Passou: ${passed}/${total} testes`);
  
  if (passed === total) {
    console.log('🎉 Todos os testes passaram! O fluxo de autenticação está funcionando corretamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os logs acima para mais detalhes.');
  }
  
  return passed === total;
}

// Executar se chamado diretamente
runAllTests().catch(console.error);

export { runAllTests };