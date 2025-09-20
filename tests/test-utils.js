/**
 * Utilitários auxiliares para testes
 * Funções compartilhadas entre os diferentes arquivos de teste
 */

/**
 * Reseta todos os dados de teste no localStorage
 */
function resetTestData() {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Lista de todas as chaves do localStorage usadas pelo app
    const keys = [
      'sua-grana-transactions',
      'sua-grana-accounts',
      'sua-grana-goals',
      'sua-grana-investments',
      'sua-grana-trips',
      'sua-grana-categories',
      'sua-grana-tags',
      'sua-grana-budgets',
      'sua-grana-contacts',
      'sua-grana-notifications',
      'sua-grana-user-profile',
      'sua-grana-dividends',
      'sua-grana-emergency-reserve',
      'sua-grana-billing-payments',
      'sua-grana-shared-bills',
      'sua-grana-accounting-entries',
      'sua-grana-shared-debts'
    ];
    
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
  }
  
  // Criar dados padrão para testes
  createDefaultTestData();
}

/**
 * Cria dados padrão para testes
 */
function createDefaultTestData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  // Contas padrão
  const defaultAccounts = [
    {
      id: "1",
      name: "Conta Corrente",
      type: "checking",
      balance: 1500,
      bank: "Banco Teste",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2", 
      name: "Poupança",
      type: "savings",
      balance: 5000,
      bank: "Banco Teste",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      name: "Cartão de Crédito", 
      type: "credit",
      balance: -800,
      creditLimit: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Transações padrão
  const defaultTransactions = [
    {
      id: "1",
      description: "Salário",
      amount: 3000,
      type: "income",
      category: "Salário",
      account: "Conta Corrente",
      date: "2024-01-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2", 
      description: "Supermercado",
      amount: -200,
      type: "expense",
      category: "Alimentação",
      account: "Conta Corrente", 
      date: "2024-01-02",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "3",
      description: "Compra Online",
      amount: -150,
      type: "expense", 
      category: "Compras",
      account: "Cartão de Crédito",
      date: "2024-01-03",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Metas padrão
  const defaultGoals = [
    {
      id: "1",
      name: "Reserva de Emergência",
      description: "6 meses de despesas",
      target: 18000,
      current: 5000,
      deadline: "2024-12-31",
      category: "Emergência",
      priority: "high",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "2",
      name: "Viagem",
      description: "Férias na Europa",
      target: 10000,
      current: 2500,
      deadline: "2024-06-30", 
      category: "Viagem",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Salvar no localStorage
  localStorage.setItem('sua-grana-accounts', JSON.stringify(defaultAccounts));
  localStorage.setItem('sua-grana-transactions', JSON.stringify(defaultTransactions));
  localStorage.setItem('sua-grana-goals', JSON.stringify(defaultGoals));
  localStorage.setItem('sua-grana-investments', JSON.stringify([]));
  localStorage.setItem('sua-grana-accounting-entries', JSON.stringify([]));
}

/**
 * Gera uma data aleatória para testes
 */
function generateDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

/**
 * Gera uma categoria aleatória para testes
 */
function generateCategory() {
  const categories = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Outros'];
  return categories[Math.floor(Math.random() * categories.length)];
}

/**
 * Gera um valor monetário aleatório para testes
 */
function generateAmount() {
  return Math.floor(Math.random() * 1000) + 10; // Entre 10 e 1010
}

// Exportar utilitários para Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resetTestData,
    createDefaultTestData,
    generateDate,
    generateCategory,
    generateAmount
  };
}

// Tornar disponível globalmente para testes no browser
if (typeof window !== 'undefined') {
  window.resetTestData = resetTestData;
  window.createDefaultTestData = createDefaultTestData; 
  window.testUtils = {
    resetTestData,
    createDefaultTestData,
    generateDate,
    generateCategory,
    generateAmount
  };
}
