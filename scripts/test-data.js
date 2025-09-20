// Test script to create sample data and verify storage system
console.log("🧪 Iniciando teste do sistema de dados...");

// Test localStorage functionality
function testLocalStorage() {
  console.log("📦 Testando localStorage...");
  
  try {
    // Test basic localStorage
    localStorage.setItem('test-key', 'test-value');
    const testValue = localStorage.getItem('test-key');
    console.log('✅ localStorage básico funcionando:', testValue);
    
    // Check existing data
    const existingTransactions = localStorage.getItem('sua-grana-transactions');
    const existingAccounts = localStorage.getItem('sua-grana-accounts');
    const existingGoals = localStorage.getItem('sua-grana-goals');
    
    console.log('📊 Dados existentes:');
    console.log('- Transações:', existingTransactions ? JSON.parse(existingTransactions).length : 0);
    console.log('- Contas:', existingAccounts ? JSON.parse(existingAccounts).length : 0);
    console.log('- Metas:', existingGoals ? JSON.parse(existingGoals).length : 0);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no localStorage:', error);
    return false;
  }
}

// Create test data
function createTestData() {
  console.log("🏗️ Criando dados de teste...");
  
  try {
    // Create test accounts
    const testAccounts = [
      {
        id: 'acc-1',
        name: 'Conta Corrente Principal',
        type: 'checking',
        balance: 5000.00,
        bank: 'Banco do Brasil',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'acc-2', 
        name: 'Poupança',
        type: 'savings',
        balance: 10000.00,
        bank: 'Caixa Econômica',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Create test transactions
    const testTransactions = [
      {
        id: 'trans-1',
        description: 'Salário Mensal',
        amount: 8000.00,
        type: 'income',
        category: 'Salário',
        account: 'acc-1',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'trans-2',
        description: 'Compras no Supermercado',
        amount: -450.00,
        type: 'expense',
        category: 'Alimentação',
        account: 'acc-1',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'trans-3',
        description: 'Combustível',
        amount: -200.00,
        type: 'expense', 
        category: 'Transporte',
        account: 'acc-1',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'trans-4',
        description: 'Freelance Design',
        amount: 1500.00,
        type: 'income',
        category: 'Freelance',
        account: 'acc-1',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Create test goals
    const testGoals = [
      {
        id: 'goal-1',
        name: 'Reserva de Emergência',
        target: 30000.00,
        current: 10000.00,
        category: 'reserva',
        priority: 'high',
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Criar uma reserva de emergência de 6 meses',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'goal-2',
        name: 'Viagem Europa',
        target: 15000.00,
        current: 5000.00,
        category: 'viagem',
        priority: 'medium',
        deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Viagem de 15 dias pela Europa',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Save to localStorage
    localStorage.setItem('sua-grana-accounts', JSON.stringify(testAccounts));
    localStorage.setItem('sua-grana-transactions', JSON.stringify(testTransactions));
    localStorage.setItem('sua-grana-goals', JSON.stringify(testGoals));
    
    // Dispatch storage change event
    window.dispatchEvent(new CustomEvent('storageChange', {
      detail: { key: 'sua-grana-transactions', action: 'save', timestamp: new Date().toISOString() }
    }));
    window.dispatchEvent(new CustomEvent('storageChange', {
      detail: { key: 'sua-grana-accounts', action: 'save', timestamp: new Date().toISOString() }
    }));
    window.dispatchEvent(new CustomEvent('storageChange', {
      detail: { key: 'sua-grana-goals', action: 'save', timestamp: new Date().toISOString() }
    }));
    
    console.log('✅ Dados de teste criados com sucesso!');
    console.log('📊 Resumo dos dados criados:');
    console.log('- Contas:', testAccounts.length);
    console.log('- Transações:', testTransactions.length);
    console.log('- Metas:', testGoals.length);
    
    // Calculate totals
    const totalIncome = testTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = testTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = totalIncome - totalExpenses;
    
    console.log('💰 Resumo financeiro:');
    console.log('- Receitas:', `R$ ${totalIncome.toFixed(2)}`);
    console.log('- Despesas:', `R$ ${totalExpenses.toFixed(2)}`);
    console.log('- Saldo:', `R$ ${balance.toFixed(2)}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error);
    return false;
  }
}

// Clear all test data
function clearTestData() {
  console.log("🧹 Limpando dados de teste...");
  
  const keys = [
    'sua-grana-transactions',
    'sua-grana-accounts', 
    'sua-grana-goals',
    'sua-grana-investments',
    'sua-grana-trips',
    'test-key'
  ];
  
  keys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Dados limpos com sucesso!');
}

// Main test function
function runTests() {
  console.log("🚀 Iniciando testes completos...\n");
  
  // Test 1: localStorage
  if (!testLocalStorage()) {
    console.error("❌ Teste de localStorage falhou!");
    return;
  }
  
  // Test 2: Create test data
  if (!createTestData()) {
    console.error("❌ Criação de dados de teste falhou!");
    return;
  }
  
  console.log("\n✅ Todos os testes passaram!");
  console.log("🔄 Recarregue a página para ver os dados no dashboard");
  
  // Return test functions for manual use
  return {
    createTestData,
    clearTestData,
    testLocalStorage
  };
}

// Auto-run tests if script is loaded directly
if (typeof window !== 'undefined') {
  window.testFinancialData = runTests();
}
