// Quick fix script - copy and paste this into your browser console on the Análise Financeira page

console.log('🔧 Quick Fix for Análise Financeira Data...');

// Clear all possible keys
['transactions', 'accounts', 'goals', 'sua-grana-transactions', 'sua-grana-accounts', 'sua-grana-goals'].forEach(key => {
    localStorage.removeItem(key);
});

// Sample data for charts
const chartData = {
    transactions: [
        // Recent transactions for current month (December 2024)
        { id: 'inc1', type: 'income', amount: 5000, description: 'Salário', category: 'Salário', date: '2024-12-01', accountId: 'acc1' },
        { id: 'inc2', type: 'income', amount: 800, description: 'Freelance', category: 'Trabalho Extra', date: '2024-12-05', accountId: 'acc1' },
        
        // Expenses in current month with various categories
        { id: 'exp1', type: 'expense', amount: -1200, description: 'Aluguel', category: 'Moradia', date: '2024-12-01', accountId: 'acc1' },
        { id: 'exp2', type: 'expense', amount: -800, description: 'Supermercado', category: 'Alimentação', date: '2024-12-03', accountId: 'acc1' },
        { id: 'exp3', type: 'expense', amount: -300, description: 'Energia', category: 'Utilidades', date: '2024-12-05', accountId: 'acc1' },
        { id: 'exp4', type: 'expense', amount: -450, description: 'Transporte', category: 'Transporte', date: '2024-12-07', accountId: 'acc1' },
        { id: 'exp5', type: 'expense', amount: -200, description: 'Academia', category: 'Saúde', date: '2024-12-10', accountId: 'acc1' },
        
        // Previous months for trends
        { id: 'inc3', type: 'income', amount: 5200, description: 'Salário Nov', category: 'Salário', date: '2024-11-01', accountId: 'acc1' },
        { id: 'exp6', type: 'expense', amount: -1200, description: 'Aluguel Nov', category: 'Moradia', date: '2024-11-01', accountId: 'acc1' },
        { id: 'exp7', type: 'expense', amount: -750, description: 'Compras Nov', category: 'Alimentação', date: '2024-11-05', accountId: 'acc1' },
        
        { id: 'inc4', type: 'income', amount: 5100, description: 'Salário Out', category: 'Salário', date: '2024-10-01', accountId: 'acc1' },
        { id: 'exp8', type: 'expense', amount: -1200, description: 'Aluguel Out', category: 'Moradia', date: '2024-10-01', accountId: 'acc1' },
        { id: 'exp9', type: 'expense', amount: -680, description: 'Compras Out', category: 'Alimentação', date: '2024-10-08', accountId: 'acc1' },
    ],
    
    accounts: [
        { id: 'acc1', name: 'Conta Corrente', type: 'checking', balance: 8500, bank: 'Banco do Brasil' },
        { id: 'acc2', name: 'Poupança', type: 'savings', balance: 12000, bank: 'Caixa Econômica' },
        { id: 'acc3', name: 'Investimentos', type: 'investment', balance: 25000, bank: 'XP Investimentos' }
    ],
    
    goals: [
        { id: 'goal1', name: 'Reserva Emergência', targetAmount: 30000, currentAmount: 12000, targetDate: '2025-12-31', category: 'Emergência' },
        { id: 'goal2', name: 'Viagem', targetAmount: 15000, currentAmount: 8500, targetDate: '2025-06-30', category: 'Lazer' }
    ]
};

// Set data with both key formats
localStorage.setItem('transactions', JSON.stringify(chartData.transactions));
localStorage.setItem('accounts', JSON.stringify(chartData.accounts));
localStorage.setItem('goals', JSON.stringify(chartData.goals));

localStorage.setItem('sua-grana-transactions', JSON.stringify(chartData.transactions));
localStorage.setItem('sua-grana-accounts', JSON.stringify(chartData.accounts));
localStorage.setItem('sua-grana-goals', JSON.stringify(chartData.goals));

// Trigger events to notify components
if (window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('storage', { detail: { key: 'transactions' } }));
    window.dispatchEvent(new CustomEvent('storageChange', { detail: { key: 'transactions' } }));
    window.dispatchEvent(new CustomEvent('storageChange', { detail: { key: 'sua-grana-transactions' } }));
}

// Summary
const totalIncome = chartData.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
const totalExpenses = chartData.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

console.log('✅ Data loaded!');
console.log('💰 Total Income: R$', totalIncome.toFixed(2));
console.log('💸 Total Expenses: R$', totalExpenses.toFixed(2));
console.log('💵 Net Balance: R$', (totalIncome - totalExpenses).toFixed(2));
console.log('🏦 Accounts:', chartData.accounts.length);
console.log('🎯 Goals:', chartData.goals.length);

console.log('\n🔄 Now refresh the page to see the data!');

// Return confirmation
'✅ Análise Financeira data loaded! Refresh the page.';
