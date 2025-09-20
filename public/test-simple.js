// Script simples para inserir dados de teste
console.log('🧹 Limpando dados...');
localStorage.clear();

const transactions = [
  {
    id: '1',
    description: 'Salário Teste',
    amount: 5000,
    type: 'income',
    category: 'Salário',
    date: '2025-01-08',
    accountId: '1'
  },
  {
    id: '2', 
    description: 'Compras Supermercado',
    amount: -300,
    type: 'expense',
    category: 'Alimentação',
    date: '2025-01-08',
    accountId: '1'
  }
];

const accounts = [
  {
    id: '1',
    name: 'Conta Principal',
    type: 'checking',
    balance: 4700,
    bank: 'Banco do Brasil'
  }
];

localStorage.setItem('sua-grana-transactions', JSON.stringify(transactions));
localStorage.setItem('sua-grana-accounts', JSON.stringify(accounts));

console.log('✅ 2 transações criadas!');
console.log('✅ 1 conta criada!');
console.log('🔄 RECARREGUE A PÁGINA!');
