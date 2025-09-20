// Copy and paste this entire script into your browser console 
// while on the SuaGrana website to populate test data

console.log('🚀 Starting SuaGrana Financial Data Population...');

// Clear existing data
['transactions', 'accounts', 'goals', 'sua-grana-transactions', 'sua-grana-accounts', 'sua-grana-goals'].forEach(key => {
  localStorage.removeItem(key);
});

// Test data for financial analysis
const testData = {
  transactions: [
    // Income transactions
    { id: 'inc1', type: 'income', amount: 5000, description: 'Salário Janeiro', category: 'Salário', date: '2024-01-15', accountId: 'acc1' },
    { id: 'inc2', type: 'income', amount: 5200, description: 'Salário Fevereiro', category: 'Salário', date: '2024-02-15', accountId: 'acc1' },
    { id: 'inc3', type: 'income', amount: 5100, description: 'Salário Março', category: 'Salário', date: '2024-03-15', accountId: 'acc1' },
    { id: 'inc4', type: 'income', amount: 800, description: 'Freelance', category: 'Trabalho Extra', date: '2024-03-20', accountId: 'acc2' },
    { id: 'inc5', type: 'income', amount: 5300, description: 'Salário Abril', category: 'Salário', date: '2024-04-15', accountId: 'acc1' },
    
    // Expense transactions with different categories
    { id: 'exp1', type: 'expense', amount: -1200, description: 'Aluguel Janeiro', category: 'Moradia', date: '2024-01-05', accountId: 'acc1' },
    { id: 'exp2', type: 'expense', amount: -800, description: 'Supermercado', category: 'Alimentação', date: '2024-01-10', accountId: 'acc1' },
    { id: 'exp3', type: 'expense', amount: -300, description: 'Energia Elétrica', category: 'Utilidades', date: '2024-01-12', accountId: 'acc1' },
    { id: 'exp4', type: 'expense', amount: -150, description: 'Internet', category: 'Utilidades', date: '2024-01-15', accountId: 'acc1' },
    { id: 'exp5', type: 'expense', amount: -450, description: 'Gasolina', category: 'Transporte', date: '2024-01-18', accountId: 'acc1' },
    
    { id: 'exp6', type: 'expense', amount: -1200, description: 'Aluguel Fevereiro', category: 'Moradia', date: '2024-02-05', accountId: 'acc1' },
    { id: 'exp7', type: 'expense', amount: -750, description: 'Supermercado', category: 'Alimentação', date: '2024-02-08', accountId: 'acc1' },
    { id: 'exp8', type: 'expense', amount: -280, description: 'Energia Elétrica', category: 'Utilidades', date: '2024-02-12', accountId: 'acc1' },
    { id: 'exp9', type: 'expense', amount: -200, description: 'Farmácia', category: 'Saúde', date: '2024-02-20', accountId: 'acc1' },
    { id: 'exp10', type: 'expense', amount: -120, description: 'Cinema', category: 'Entretenimento', date: '2024-02-25', accountId: 'acc2' },
    
    { id: 'exp11', type: 'expense', amount: -1200, description: 'Aluguel Março', category: 'Moradia', date: '2024-03-05', accountId: 'acc1' },
    { id: 'exp12', type: 'expense', amount: -820, description: 'Supermercado', category: 'Alimentação', date: '2024-03-10', accountId: 'acc1' },
    { id: 'exp13', type: 'expense', amount: -350, description: 'Energia Elétrica', category: 'Utilidades', date: '2024-03-15', accountId: 'acc1' },
    { id: 'exp14', type: 'expense', amount: -600, description: 'Dentista', category: 'Saúde', date: '2024-03-22', accountId: 'acc1' },
    { id: 'exp15', type: 'expense', amount: -250, description: 'Roupas', category: 'Vestuário', date: '2024-03-28', accountId: 'acc2' },
    
    { id: 'exp16', type: 'expense', amount: -1200, description: 'Aluguel Abril', category: 'Moradia', date: '2024-04-05', accountId: 'acc1' },
    { id: 'exp17', type: 'expense', amount: -900, description: 'Supermercado', category: 'Alimentação', date: '2024-04-12', accountId: 'acc1' },
    { id: 'exp18', type: 'expense', amount: -320, description: 'Energia Elétrica', category: 'Utilidades', date: '2024-04-15', accountId: 'acc1' },
    { id: 'exp19', type: 'expense', amount: -180, description: 'Restaurante', category: 'Alimentação', date: '2024-04-18', accountId: 'acc2' },
    { id: 'exp20', type: 'expense', amount: -400, description: 'Manutenção Carro', category: 'Transporte', date: '2024-04-20', accountId: 'acc1' }
  ],
  
  accounts: [
    { id: 'acc1', name: 'Conta Corrente Principal', type: 'checking', balance: 8500.00, bank: 'Banco do Brasil' },
    { id: 'acc2', name: 'Poupança', type: 'savings', balance: 12300.50, bank: 'Caixa Econômica' },
    { id: 'acc3', name: 'Conta Investimentos', type: 'investment', balance: 25000.00, bank: 'XP Investimentos' }
  ],
  
  goals: [
    { id: 'goal1', name: 'Viagem Europa', targetAmount: 15000, currentAmount: 8500, targetDate: '2024-12-31', category: 'Viagem' },
    { id: 'goal2', name: 'Reserva Emergência', targetAmount: 30000, currentAmount: 12300, targetDate: '2024-06-30', category: 'Emergência' },
    { id: 'goal3', name: 'Carro Novo', targetAmount: 80000, currentAmount: 25000, targetDate: '2025-03-31', category: 'Bens' }
  ]
};

// Store data with both key formats for maximum compatibility
localStorage.setItem('transactions', JSON.stringify(testData.transactions));
localStorage.setItem('accounts', JSON.stringify(testData.accounts));
localStorage.setItem('goals', JSON.stringify(testData.goals));

localStorage.setItem('sua-grana-transactions', JSON.stringify(testData.transactions));
localStorage.setItem('sua-grana-accounts', JSON.stringify(testData.accounts));
localStorage.setItem('sua-grana-goals', JSON.stringify(testData.goals));

// Trigger storage events to notify components
window.dispatchEvent(new CustomEvent('storageChange', { detail: { key: 'transactions' } }));
window.dispatchEvent(new CustomEvent('storageChange', { detail: { key: 'sua-grana-transactions' } }));

// Summary
const totalIncome = testData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
const totalExpenses = testData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

console.log('✅ Test data loaded successfully!');
console.log('📊 Data Summary:');
console.log(`• ${testData.transactions.length} transactions`);
console.log(`• ${testData.accounts.length} accounts`); 
console.log(`• ${testData.goals.length} goals`);
console.log(`• Total Income: R$ ${totalIncome.toFixed(2)}`);
console.log(`• Total Expenses: R$ ${totalExpenses.toFixed(2)}`);
console.log(`• Net Balance: R$ ${(totalIncome - totalExpenses).toFixed(2)}`);
console.log('🔄 Refresh the page to see the data in all components!');

// Instructions
console.log('\n📝 To see the data:');
console.log('1. Go to the "Análise Financeira" page');
console.log('2. Navigate to Dashboard or Transactions pages');
console.log('3. Check Accounts and Goals pages');
console.log('4. All should now show real financial data instead of empty/zero metrics');

// Return success
'Data loaded successfully! Check the Análise Financeira page.';
