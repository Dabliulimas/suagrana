// Teste simples para verificar a integração

async function testBackendIntegration() {
  try {
    console.log('Testando conexão com o backend...');
    
    // Teste de health check
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Teste de transações
    const transactionsResponse = await fetch('http://localhost:3001/api/transactions');
    const transactionsData = await transactionsResponse.json();
    console.log('Transações:', transactionsData);
    
    // Teste de contas
    const accountsResponse = await fetch('http://localhost:3001/api/accounts');
    const accountsData = await accountsResponse.json();
    console.log('Contas:', accountsData);
    
    // Teste de investimentos
    const investmentsResponse = await fetch('http://localhost:3001/api/investments');
    const investmentsData = await investmentsResponse.json();
    console.log('Investimentos:', investmentsData);
    
    console.log('✅ Todos os endpoints estão funcionando!');
    
  } catch (error) {
    console.error('❌ Erro na integração:', error.message);
  }
}

testBackendIntegration();