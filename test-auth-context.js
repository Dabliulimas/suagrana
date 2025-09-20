// Teste para verificar se o contexto de autenticação está funcionando
const FRONTEND_URL = 'http://localhost:3000';

const testUser = {
  email: 'test@example.com',
  password: 'Password123!'
};

async function testAuthContext() {
  console.log('🧪 Testando contexto de autenticação no frontend...');
  
  try {
    // Teste 1: Verificar se a página de login carrega
    console.log('\n1️⃣ Testando carregamento da página de login...');
    const loginPageResponse = await fetch(`${FRONTEND_URL}/login`);
    console.log('📊 Status da página de login:', loginPageResponse.status);
    
    // Teste 2: Verificar se existe endpoint de verificação de token
    console.log('\n2️⃣ Testando endpoint de verificação de token...');
    const verifyResponse = await fetch(`${FRONTEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    console.log('📊 Status da verificação:', verifyResponse.status);
    
    // Teste 3: Verificar se o login via frontend funciona
    console.log('\n3️⃣ Testando login via frontend...');
    const loginResponse = await fetch(`${FRONTEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testUser),
    });
    
    const loginData = await loginResponse.json();
    console.log('📊 Status do login:', loginResponse.status);
    console.log('📝 Resposta completa do login:', JSON.stringify(loginData, null, 2));
    
    if (loginResponse.ok && loginData.success) {
      console.log('🎫 Token recebido:', loginData.data?.accessToken ? 'Sim' : 'Não');
      
      // Teste 4: Verificar se consegue acessar rota protegida após login
        console.log('\n4️⃣ Testando acesso a rota protegida após login...');
        const protectedResponse = await fetch(`${FRONTEND_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.data?.accessToken}`
        },
        credentials: 'include'
      });
      
      console.log('📊 Status da rota protegida:', protectedResponse.status);
      
      if (protectedResponse.ok) {
        const protectedData = await protectedResponse.json();
        console.log('✅ Acesso autorizado:', protectedData.success ? 'Sim' : 'Não');
      }
    }
    
    console.log('\n🎯 Teste do contexto de autenticação concluído!');
    
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

testAuthContext().catch(console.error);