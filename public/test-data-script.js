// Script para limpar e inserir dados de teste no localStorage
// Execute no console do navegador: copy(document.querySelector('script[src="/test-data-script.js"]').textContent); eval(paste());

console.log('🧹 Limpando dados existentes...');
localStorage.removeItem('sua-grana-transactions');
localStorage.removeItem('sua-grana-accounts');
localStorage.removeItem('sua-grana-goals');
localStorage.removeItem('sua-grana-investments');

console.log('📝 Adicionando dados de teste...');

// Contas de exemplo
const testAccounts = [
  {
    id: 'account-1',
    name: 'Conta Corrente Principal',
    type: 'checking',
    balance: 2500.00,
    bank: 'Banco do Brasil',
    createdAt: new Date().toISOString()
  },
  {
    id: 'account-2', 
    name: 'Poupança',
    type: 'savings',
    balance: 5000.00,
    bank: 'Caixa Econômica',
    createdAt: new Date().toISOString()
  }
];

// Transações de exemplo
const testTransactions = [
  {
    id: 'trans-1',
    description: 'Salário Teste',
    amount: 5000,
    type: 'income',
    category: 'Salário',
    date: new Date().toISOString().split('T')[0],
    accountId: 'account-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'trans-2',
    description: 'Compras Teste',
    amount: -300,
    type: 'expense',
    category: 'Alimentação',
    date: new Date().toISOString().split('T')[0],
    accountId: 'account-1',
    createdAt: new Date().toISOString()
  },
  {
    id: 'trans-3',
    description: 'Conta de Luz',
    amount: -150,
    type: 'expense',
    category: 'Utilidades',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // ontem
    accountId: 'account-1',
    createdAt: new Date().toISOString()
  }
];

// Metas de exemplo
const testGoals = [
  {
    id: 'goal-1',
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
    id: 'goal-2',
    name: 'Reserva Emergência',
    target: 15000,
    current: 5000,
    category: 'outros',
    priority: 'medium',
    createdAt: new Date().toISOString()
  }
];

// Investimentos de exemplo
const testInvestments = [
  {
    id: 'inv-1',
    name: 'Tesouro Direto IPCA+',
    initialValue: 1000,
    currentValue: 1150,
    totalValue: 1150,
    category: 'renda-fixa',
    createdAt: new Date().toISOString()
  }
];

// Salvar no localStorage
localStorage.setItem('sua-grana-accounts', JSON.stringify(testAccounts));
localStorage.setItem('sua-grana-transactions', JSON.stringify(testTransactions));
localStorage.setItem('sua-grana-goals', JSON.stringify(testGoals));
localStorage.setItem('sua-grana-investments', JSON.stringify(testInvestments));

console.log('✅ Dados de teste inseridos!');
console.log('📊 Transações:', testTransactions.length);
console.log('🏦 Contas:', testAccounts.length);
console.log('🎯 Metas:', testGoals.length);
console.log('📈 Investimentos:', testInvestments.length);

// Disparar evento de mudança no storage
window.dispatchEvent(new CustomEvent('storageChange', {
  detail: { key: 'all' }
}));

console.log('🔄 Recarregue a página para ver os dados!');
