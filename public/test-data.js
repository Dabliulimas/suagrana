// Script para popular dados de teste no localStorage
// Execute este script no console do navegador

const sampleTransactions = [
  {
    id: "txn_1704067200000_abc123",
    amount: -150.50,
    description: "Supermercado - Compras da semana",
    date: new Date().toISOString(),
    category: "Alimentação",
    type: "expense",
    account: "Conta Corrente",
    accountId: "acc_main",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "txn_1704067200001_def456",
    amount: 3500.00,
    description: "Salário",
    date: new Date().toISOString(),
    category: "Salário",
    type: "income",
    account: "Conta Corrente",
    accountId: "acc_main",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "txn_1704067200002_ghi789",
    amount: -89.90,
    description: "Gasolina",
    date: new Date().toISOString(),
    category: "Transporte",
    type: "expense",
    account: "Cartão de Crédito",
    accountId: "acc_credit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleAccounts = [
  {
    id: "acc_main",
    name: "Conta Corrente",
    type: "checking",
    balance: 2450.00,
    bankName: "Banco do Brasil",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "acc_savings",
    name: "Poupança",
    type: "savings",
    balance: 5000.00,
    bankName: "Banco do Brasil",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "acc_credit",
    name: "Cartão de Crédito",
    type: "credit",
    balance: -450.00,
    bankName: "Nubank",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleGoals = [
  {
    id: "goal_1",
    name: "Reserva de Emergência",
    target: 10000.00,
    current: 5000.00,
    targetAmount: 10000.00, // Compatibilidade backward
    currentAmount: 5000.00, // Compatibilidade backward
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
    targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(), // Compatibilidade backward
    category: "emergency",
    priority: "high",
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "goal_2",
    name: "Viagem para Europa",
    target: 15000.00,
    current: 3000.00,
    targetAmount: 15000.00, // Compatibilidade backward
    currentAmount: 3000.00, // Compatibilidade backward
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString(),
    targetDate: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString(), // Compatibilidade backward
    category: "vacation",
    priority: "medium",
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Função para popular os dados
function populateTestData() {
  localStorage.setItem('sua-grana-transactions', JSON.stringify(sampleTransactions));
  localStorage.setItem('sua-grana-accounts', JSON.stringify(sampleAccounts));
  localStorage.setItem('sua-grana-goals', JSON.stringify(sampleGoals));
  
  // Também salvar nos formatos alternativos
  localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
  localStorage.setItem('accounts', JSON.stringify(sampleAccounts));
  localStorage.setItem('goals', JSON.stringify(sampleGoals));
  
  console.log('✅ Dados de teste carregados com sucesso!');
  console.log('📊 Transações:', sampleTransactions.length);
  console.log('🏦 Contas:', sampleAccounts.length);
  console.log('🎯 Metas:', sampleGoals.length);
  
  // Recarregar a página para ver os dados
  window.location.reload();
}

// Executar automaticamente se não houver dados
if (!localStorage.getItem('sua-grana-transactions')) {
  populateTestData();
} else {
  console.log('ℹ️  Dados já existem no localStorage');
  console.log('Para recriar os dados, execute: populateTestData()');
}
