// Script de teste para verificar se as requisições do frontend funcionam após as correções
// Usando Node.js fetch nativo (disponível no Node 18+)

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001/api';

// Dados de teste
const testUser = {
  email: 'test@example.com',
  password: 'Password123!'
};

let authToken = null;
let cookies = '';

// Função para fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testUser),
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      authToken = data.data?.accessToken;
      
      // Capturar cookies da resposta
      const setCookieHeader = response.headers.get('set-cookie');
      if (setCookieHeader) {
        cookies = setCookieHeader;
      }
      
      console.log('✅ Login realizado com sucesso');
      console.log('📝 Token obtido:', authToken ? 'Sim' : 'Não');
      console.log('🍪 Cookies obtidos:', cookies ? 'Sim' : 'Não');
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

// Função para testar rota protegida via frontend (proxy)
async function testFrontendRoute(route) {
  console.log(`\n🧪 Testando ${route} via frontend (proxy)...`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token se disponível
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Adicionar cookies se disponíveis
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    const response = await fetch(`${BASE_URL}${route}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Resposta:`, data.success ? '✅ Sucesso' : `❌ ${data.message || 'Erro'}`);
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return false;
  }
}

// Função para testar rota protegida diretamente no backend
async function testBackendRoute(route) {
  console.log(`\n🧪 Testando ${route} diretamente no backend...`);
  
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Adicionar token se disponível
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    // Adicionar cookies se disponíveis
    if (cookies) {
      headers['Cookie'] = cookies;
    }
    
    const response = await fetch(`${BACKEND_URL}${route}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Resposta:`, data.success ? '✅ Sucesso' : `❌ ${data.message || 'Erro'}`);
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    return false;
  }
}

// Função principal de teste
async function runTests() {
  console.log('🚀 Iniciando testes de autenticação...\n');
  
  // 1. Fazer login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Não foi possível fazer login. Parando os testes.');
    return;
  }
  
  // 2. Testar rotas protegidas
  const routes = ['/api/accounts', '/api/transactions', '/api/goals', '/api/investments', '/api/contacts'];
  
  for (const route of routes) {
    // Testar via frontend (proxy)
    await testFrontendRoute(route);
    
    // Testar diretamente no backend
    await testBackendRoute(route);
    
    console.log('---');
  }
  
  console.log('\n🎯 Teste concluído!');
}

// Executar testes
runTests().catch(console.error);