// Script final para testar o sistema completo
console.log('🧹 Limpando localStorage...');
['sua-grana-transactions', 'sua-grana-accounts', 'sua-grana-goals', 'sua-grana-investments'].forEach(key => {
  localStorage.removeItem(key);
});

console.log('📊 Criando dados de teste...');

// Dados completos de teste
const testData = {
  accounts: [
    {
      id: 'acc-1',
      name: 'Conta Corrente Principal',
      type: 'checking',
      balance: 7150.00, // Saldo calculado das transações
      bank: 'Banco do Brasil',
      createdAt: new Date().toISOString()
    },
    {
      id: 'acc-2',
      name: 'Poupança',
      type: 'savings', 
      balance: 5000.00,
      bank: 'Caixa Econômica',
      createdAt: new Date().toISOString()
    }
  ],
  
  transactions: [
    {
      id: 'tr-1',
      description: 'Salário Teste',
      amount: 5000,
      type: 'income',
      category: 'Salário',
      date: new Date().toISOString().split('T')[0],
      accountId: 'acc-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tr-2',
      description: 'Compras Teste',
      amount: -300,
      type: 'expense', 
      category: 'Alimentação',
      date: new Date().toISOString().split('T')[0],
      accountId: 'acc-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tr-3',
      description: 'Conta de Luz',
      amount: -150,
      type: 'expense',
      category: 'Utilidades', 
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      accountId: 'acc-1',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tr-4',
      description: 'Freelance Design',
      amount: 800,
      type: 'income',
      category: 'Trabalho Extra',
      date: new Date(Date.now() - 2*86400000).toISOString().split('T')[0],
      accountId: 'acc-1', 
      createdAt: new Date().toISOString()
    },
    {
      id: 'tr-5',
      description: 'Supermercado',
      amount: -200,
      type: 'expense',
      category: 'Alimentação',
      date: new Date(Date.now() - 3*86400000).toISOString().split('T')[0],
      accountId: 'acc-1',
      createdAt: new Date().toISOString()
    }
  ],
  
  goals: [
    {
      id: 'g-1',
      name: 'Viagem Europa',
      target: 10000,
      current: 2500,
      category: 'viagem',
      priority: 'high',
      deadline: '2024-12-31',
      description: 'Economizar para viagem dos sonhos',
      createdAt: new Date().toISOString()
    },
    {
      id: 'g-2',
      name: 'Reserva Emergência',
      target: 15000,
      current: 5000,
      category: 'outros',
      priority: 'medium',
      createdAt: new Date().toISOString()
    }
  ],
  
  investments: [
    {
      id: 'i-1',
      name: 'Tesouro Direto IPCA+',
      initialValue: 1000,
      currentValue: 1150,
      totalValue: 1150,
      category: 'renda-fixa',
      createdAt: new Date().toISOString()
    },
    {
      id: 'i-2', 
      name: 'Fundo DI',
      initialValue: 2000,
      currentValue: 2080,
      totalValue: 2080,
      category: 'renda-fixa',
      createdAt: new Date().toISOString()
    }
  ]
};

// Salvar no localStorage
Object.entries(testData).forEach(([key, data]) => {
  localStorage.setItem(`sua-grana-${key}`, JSON.stringify(data));
  console.log(`✅ ${key}: ${data.length} itens`);
});

// Disparar eventos de mudança
['transactions', 'accounts', 'goals', 'investments'].forEach(key => {
  window.dispatchEvent(new CustomEvent('storageChange', {
    detail: { key: `sua-grana-${key}` }
  }));
});

console.log('🎉 SISTEMA PRONTO!');
console.log('📊 5 transações criadas');
console.log('🏦 2 contas criadas'); 
console.log('🎯 2 metas criadas');
console.log('📈 2 investimentos criados');
console.log('');
console.log('🔄 RECARREGUE A PÁGINA PARA VER OS DADOS!');
console.log(''); 
console.log('📋 Teste estas páginas:');
console.log('  • Dashboard: http://localhost:3000');
console.log('  • Transações: http://localhost:3000/transactions');
console.log('  • Contas: http://localhost:3000/accounts');
console.log('  • Metas: http://localhost:3000/goals');
