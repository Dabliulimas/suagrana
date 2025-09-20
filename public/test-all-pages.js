// Script completo para testar todas as páginas corrigidas
console.log('🧹 Limpando localStorage completamente...');
localStorage.clear();

console.log('📊 Criando dados completos do sistema...');

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const lastWeek = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
const lastMonth = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];

// Transações completas
const transactions = [
  // Receitas
  { id: '1', description: 'Salário Principal', amount: 5000, type: 'income', category: 'Salário', date: today, accountId: '1' },
  { id: '2', description: 'Freelance Web', amount: 1200, type: 'income', category: 'Trabalho Extra', date: lastWeek, accountId: '1' },
  { id: '3', description: 'Dividendos', amount: 300, type: 'income', category: 'Investimentos', date: yesterday, accountId: '2' },
  
  // Despesas atuais (gastos elevados para gerar notificações)
  { id: '4', description: 'Supermercado Atacadão', amount: -800, type: 'expense', category: 'Alimentação', date: today, accountId: '1' },
  { id: '5', description: 'Posto Shell', amount: -250, type: 'expense', category: 'Transporte', date: yesterday, accountId: '1' },
  { id: '6', description: 'Conta de Luz', amount: -180, type: 'expense', category: 'Utilidades', date: lastWeek, accountId: '1' },
  { id: '7', description: 'Internet Fibra', amount: -99, type: 'expense', category: 'Utilidades', date: lastWeek, accountId: '1' },
  { id: '8', description: 'Plano Médico', amount: -450, type: 'expense', category: 'Saúde', date: today, accountId: '1' },
  { id: '9', description: 'Academia Smart Fit', amount: -89, type: 'expense', category: 'Saúde', date: yesterday, accountId: '1' },
  { id: '10', description: 'Netflix + Spotify', amount: -45, type: 'expense', category: 'Lazer', date: lastWeek, accountId: '1' },
  
  // Transações do mês passado para análises
  { id: '11', description: 'Salário Anterior', amount: 5000, type: 'income', category: 'Salário', date: lastMonth, accountId: '1' },
  { id: '12', description: 'Supermercado Anterior', amount: -600, type: 'expense', category: 'Alimentação', date: lastMonth, accountId: '1' },
  { id: '13', description: 'Combustível Anterior', amount: -200, type: 'expense', category: 'Transporte', date: lastMonth, accountId: '1' },
];

// Contas com saldos realistas
const accounts = [
  {
    id: '1',
    name: 'Conta Corrente Itaú',
    type: 'checking',
    balance: 8500, // Saldo bom mas não excelente
    bank: 'Banco Itaú',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Poupança Caixa',
    type: 'savings', 
    balance: 5000,
    bank: 'Caixa Econômica',
    createdAt: new Date().toISOString()
  }
];

// Metas com prazos próximos para notificações
const goals = [
  {
    id: '1',
    name: 'Viagem Europa',
    target: 15000,
    current: 8000,
    category: 'viagem',
    priority: 'high',
    deadline: '2025-02-15', // Prazo próximo
    description: 'Viagem dos sonhos para Europa',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Reserva Emergência',
    target: 20000,
    current: 13500,
    category: 'emergencia',
    priority: 'high',
    description: '6 meses de gastos guardados',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Carro Novo',
    target: 45000,
    current: 12000,
    category: 'veiculo',
    priority: 'medium',
    deadline: '2025-12-31',
    createdAt: new Date().toISOString()
  }
];

// Investimentos para análises
const investments = [
  {
    id: '1',
    name: 'Tesouro IPCA+ 2029',
    initialValue: 5000,
    currentValue: 5800,
    totalValue: 5800,
    category: 'renda-fixa',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Fundo Multimercado',
    initialValue: 3000,
    currentValue: 3450,
    totalValue: 3450,
    category: 'fundos',
    createdAt: new Date().toISOString()
  }
];

// Limites de orçamento para a página de budget
const budgetLimits = [
  {
    id: '1',
    name: 'Alimentação',
    budgeted: 1000,
    month: new Date().toISOString().slice(0, 7),
    color: '#ef4444',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Transporte',
    budgeted: 400,
    month: new Date().toISOString().slice(0, 7),
    color: '#3b82f6',
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Saúde',
    budgeted: 600,
    month: new Date().toISOString().slice(0, 7),
    color: '#10b981',
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Lazer',
    budgeted: 300,
    month: new Date().toISOString().slice(0, 7),
    color: '#f59e0b',
    createdAt: new Date().toISOString()
  }
];

// Salvar todos os dados
localStorage.setItem('sua-grana-transactions', JSON.stringify(transactions));
localStorage.setItem('sua-grana-accounts', JSON.stringify(accounts));
localStorage.setItem('sua-grana-goals', JSON.stringify(goals));
localStorage.setItem('sua-grana-investments', JSON.stringify(investments));
localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));

console.log('✅ SISTEMA COMPLETAMENTE CONFIGURADO!');
console.log('');
console.log('📊 Dados criados:');
console.log(`  💰 ${transactions.length} transações (Receitas: R$ 6.500, Gastos: R$ 1.913)`);
console.log(`  🏦 ${accounts.length} contas (Total: R$ 13.500)`);
console.log(`  🎯 ${goals.length} metas (1 com prazo próximo)`);
console.log(`  📈 ${investments.length} investimentos (Total: R$ 9.250)`);
console.log(`  📋 ${budgetLimits.length} categorias de orçamento`);
console.log('');
console.log('🔔 NOTIFICAÇÕES que devem aparecer:');
console.log('  ⚠️  Gastos Elevados (R$ 1.913 este mês)');
console.log('  📅 Meta próxima do prazo (Viagem Europa em 160 dias)');
console.log('');
console.log('🔄 RECARREGUE A PÁGINA E TESTE:');
console.log('');
console.log('📱 PÁGINAS CORRIGIDAS:');
console.log('  ✅ Dashboard principal: http://localhost:3000');
console.log('  ✅ Transações: http://localhost:3000/transactions');
console.log('  ✅ Análise Financeira: http://localhost:3000/advanced-dashboard?tab=analysis');
console.log('  ✅ Analytics: http://localhost:3000/advanced-dashboard?tab=analytics');
console.log('  ✅ Orçamento: http://localhost:3000/budget');
console.log('  ✅ Contas: http://localhost:3000/accounts');
console.log('  ✅ Metas: http://localhost:3000/goals');
console.log('');
console.log('🔔 Sino de notificações: Clique no sino no header para ver notificações baseadas nos dados reais!');
