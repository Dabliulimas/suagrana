// Script para testar página de análise financeira
console.log('🧹 Limpando localStorage...');
localStorage.clear();

console.log('📊 Criando dados completos para análise...');

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const lastWeek = new Date(Date.now() - 7*86400000).toISOString().split('T')[0];
const lastMonth = new Date(Date.now() - 30*86400000).toISOString().split('T')[0];

const transactions = [
  // Receitas
  { id: '1', description: 'Salário Principal', amount: 5000, type: 'income', category: 'Salário', date: today, accountId: '1' },
  { id: '2', description: 'Freelance', amount: 1200, type: 'income', category: 'Trabalho Extra', date: lastWeek, accountId: '1' },
  
  // Despesas do mês atual
  { id: '3', description: 'Supermercado', amount: -400, type: 'expense', category: 'Alimentação', date: today, accountId: '1' },
  { id: '4', description: 'Conta de Luz', amount: -150, type: 'expense', category: 'Utilidades', date: yesterday, accountId: '1' },
  { id: '5', description: 'Internet', amount: -89, type: 'expense', category: 'Utilidades', date: lastWeek, accountId: '1' },
  { id: '6', description: 'Gasolina', amount: -200, type: 'expense', category: 'Transporte', date: today, accountId: '1' },
  { id: '7', description: 'Farmácia', amount: -50, type: 'expense', category: 'Saúde', date: yesterday, accountId: '1' },
  { id: '8', description: 'Netflix', amount: -29, type: 'expense', category: 'Lazer', date: lastWeek, accountId: '1' },
  
  // Despesas do mês passado
  { id: '9', description: 'Salário Passado', amount: 5000, type: 'income', category: 'Salário', date: lastMonth, accountId: '1' },
  { id: '10', description: 'Mercado Passado', amount: -350, type: 'expense', category: 'Alimentação', date: lastMonth, accountId: '1' },
  { id: '11', description: 'Combustível Passado', amount: -180, type: 'expense', category: 'Transporte', date: lastMonth, accountId: '1' },
];

const accounts = [
  {
    id: '1',
    name: 'Conta Corrente Principal',
    type: 'checking',
    balance: 12000, // Boa reserva de emergência
    bank: 'Banco do Brasil'
  },
  {
    id: '2',
    name: 'Poupança',
    type: 'savings',
    balance: 8000,
    bank: 'Caixa Econômica'
  }
];

const goals = [
  {
    id: '1',
    name: 'Reserva de Emergência',
    target: 15000,
    current: 12000,
    category: 'emergencia',
    priority: 'high'
  },
  {
    id: '2',
    name: 'Viagem Europa',
    target: 10000,
    current: 3000,
    category: 'viagem',
    priority: 'medium'
  }
];

// Salvar dados
localStorage.setItem('sua-grana-transactions', JSON.stringify(transactions));
localStorage.setItem('sua-grana-accounts', JSON.stringify(accounts));
localStorage.setItem('sua-grana-goals', JSON.stringify(goals));

console.log('✅ Sistema configurado com:');
console.log(`  📊 ${transactions.length} transações`);
console.log(`  🏦 ${accounts.length} contas (R$ ${accounts.reduce((s, a) => s + a.balance, 0)})`);
console.log(`  🎯 ${goals.length} metas`);
console.log(`  💰 Receita mensal: R$ 6.200`);
console.log(`  💸 Gastos mensais: R$ 918`);
console.log(`  📈 Saldo positivo: R$ 5.282`);
console.log('');
console.log('🔄 RECARREGUE A PÁGINA E ACESSE:');
console.log('  • http://localhost:3000/advanced-dashboard?tab=analysis');
console.log('  • Ou Dashboard > Análises > Análise Financeira');
console.log('');
console.log('📊 A análise deve mostrar:');
console.log('  ✅ Score de saúde financeira alto');
console.log('  ✅ Reserva de emergência adequada'); 
console.log('  ✅ Fluxo de caixa positivo');
console.log('  ✅ Gastos por categoria');
console.log('  ✅ Tendência dos últimos meses');
