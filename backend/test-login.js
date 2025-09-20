const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testando login via API...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login bem-sucedido!');
    console.log('Token:', response.data.token);
    console.log('Usuário:', response.data.user);
    
    // Testar busca de transações
    const transactionsResponse = await axios.get('http://localhost:3001/api/transactions', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('\nTransações encontradas:', transactionsResponse.data);
    
  } catch (error) {
    console.error('Erro no login:', error.response?.data || error.message);
  }
}

testLogin();