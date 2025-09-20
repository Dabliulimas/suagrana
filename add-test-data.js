// Script para adicionar dados de teste
async function addTestData() {
  try {
    console.log('Adicionando dados de teste...');
    
    // Adicionar uma conta
    const timestamp = Date.now();
    const accountData = {
      name: `Conta Corrente Teste ${timestamp}`,
      type: "CHECKING",
      balance: 5000,
      currency: "BRL",
      description: "Conta de teste para demonstração"
    };
    
    const accountResponse = await fetch('http://localhost:3001/api/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData)
    });
    
    const account = await accountResponse.json();
    console.log('Conta criada:', account);

    // Obter o ID da conta criada
    const accountId = account?.data?.account?.id;
    if (!accountId) {
      console.error('Erro: ID da conta não encontrado');
      return;
    }
    
    if (account.success && account.data) {
      // Adicionar algumas transações
    const transactions = [
      {
        type: "INCOME",
        accountId: accountId,
        amount: 2500,
        category: "Salário",
        description: "Salário mensal",
        date: new Date().toISOString()
      },
      {
        type: "EXPENSE",
        accountId: accountId,
        amount: 800,
        category: "Alimentação",
        description: "Supermercado",
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 dia atrás
      },
      {
        type: "EXPENSE",
        accountId: accountId,
        amount: 1200,
        category: "Moradia",
        description: "Aluguel",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dias atrás
      }
    ];
      
      for (const transactionData of transactions) {
          try {
            console.log('Enviando transação:', transactionData);
            const transactionResponse = await fetch('http://localhost:3001/api/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(transactionData)
            });
            const transaction = await transactionResponse.json();
            console.log('Transação criada:', transaction);
          } catch (error) {
            console.error('Erro ao criar transação:', error);
          }
        }
    }
    
    console.log('✅ Dados de teste adicionados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error.message);
  }
}

addTestData();