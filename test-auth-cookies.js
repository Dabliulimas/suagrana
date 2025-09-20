// Script para testar o sistema de autenticação baseado em cookies
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001';

// Função para fazer requisições e capturar cookies
async function testAuthEndpoint(endpoint, method = 'GET', body = null, cookies = '') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    // Capturar cookies da resposta
    const setCookieHeaders = response.headers.raw()['set-cookie'] || [];
    
    console.log(`\n=== ${method} ${endpoint} ===`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (setCookieHeaders.length > 0) {
      console.log('Set-Cookie Headers:');
      setCookieHeaders.forEach(cookie => {
        console.log('  -', cookie);
      });
    }
    
    return { response, data, cookies: setCookieHeaders };
  } catch (error) {
    console.error(`Erro ao testar ${endpoint}:`, error.message);
    return null;
  }
}

// Função para extrair cookies das headers
function extractCookies(setCookieHeaders) {
  return setCookieHeaders.map(header => {
    return header.split(';')[0]; // Pega apenas o nome=valor
  }).join('; ');
}

async function runAuthTests() {
  console.log('🧪 Iniciando testes do sistema de autenticação com cookies...\n');

  // Teste 1: Registrar um usuário
  console.log('📝 Teste 1: Registro de usuário');
  const registerResult = await testAuthEndpoint('/api/auth/register', 'POST', {
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    password: 'MinhaSenh@123'
  });

  if (!registerResult) {
    console.log('❌ Falha no teste de registro');
    return;
  }

  let authCookies = '';
  if (registerResult.cookies.length > 0) {
    authCookies = extractCookies(registerResult.cookies);
    console.log('✅ Cookies de autenticação recebidos no registro');
  } else {
    console.log('⚠️ Nenhum cookie recebido no registro');
  }

  // Teste 2: Login
  console.log('\n🔐 Teste 2: Login');
  const loginResult = await testAuthEndpoint('/api/auth/login', 'POST', {
    email: 'teste@exemplo.com',
    password: 'MinhaSenh@123'
  });

  if (loginResult && loginResult.cookies.length > 0) {
    authCookies = extractCookies(loginResult.cookies);
    console.log('✅ Cookies de autenticação recebidos no login');
  }

  // Teste 3: Acessar rota protegida (/me)
  console.log('\n👤 Teste 3: Acessar perfil do usuário (/me)');
  const meResult = await testAuthEndpoint('/api/auth/me', 'GET', null, authCookies);

  if (meResult && meResult.response.status === 200) {
    console.log('✅ Acesso autorizado com cookies');
  } else {
    console.log('❌ Falha no acesso com cookies');
  }

  // Teste 4: Refresh token
  console.log('\n🔄 Teste 4: Refresh token');
  const refreshResult = await testAuthEndpoint('/api/auth/refresh', 'POST', {}, authCookies);

  if (refreshResult && refreshResult.cookies.length > 0) {
    authCookies = extractCookies(refreshResult.cookies);
    console.log('✅ Novos cookies recebidos no refresh');
  }

  // Teste 5: Logout
  console.log('\n🚪 Teste 5: Logout');
  const logoutResult = await testAuthEndpoint('/api/auth/logout', 'POST', {}, authCookies);

  if (logoutResult && logoutResult.response.status === 200) {
    console.log('✅ Logout realizado com sucesso');
    
    // Verificar se os cookies foram limpos
    if (logoutResult.cookies.some(cookie => cookie.includes('sua-grana-token=;'))) {
      console.log('✅ Cookies foram limpos no logout');
    }
  }

  // Teste 6: Tentar acessar rota protegida após logout
  console.log('\n🔒 Teste 6: Tentar acessar /me após logout');
  const meAfterLogoutResult = await testAuthEndpoint('/api/auth/me', 'GET', null, '');

  if (meAfterLogoutResult && meAfterLogoutResult.response.status === 401) {
    console.log('✅ Acesso negado após logout (comportamento esperado)');
  } else {
    console.log('❌ Falha: ainda consegue acessar após logout');
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar os testes
runAuthTests().catch(console.error);