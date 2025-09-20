/**
 * Utilitário para testar o sistema de notificações com dados reais
 * Execute no console do navegador para adicionar dados que gerem notificações
 */

export const addTestDataForNotifications = () => {
  // Adicionar transações que gerem alerta de gastos altos
  const highExpenseTransactions = [
    {
      id: 'test-expense-1',
      amount: -800,
      description: 'Supermercado - Compras do mês',
      category: 'Alimentação',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente'
    },
    {
      id: 'test-expense-2', 
      amount: -1200,
      description: 'Aluguel',
      category: 'Moradia',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente'
    },
    {
      id: 'test-expense-3',
      amount: -500,
      description: 'Gasolina e manutenção',
      category: 'Transporte',
      type: 'expense',
      date: new Date().toISOString(),
      account: 'conta-corrente'
    }
  ];

  // Adicionar contas com saldo baixo
  const lowBalanceAccounts = [
    {
      id: 'test-account-1',
      name: 'Conta Corrente Principal',
      type: 'checking',
      balance: 350, // Saldo baixo para gerar notificação
      bank: 'Banco do Brasil'
    }
  ];

  // Adicionar meta próxima do prazo
  const urgentGoals = [
    {
      id: 'test-goal-1',
      name: 'Viagem para Europa',
      description: 'Economizar para viagem dos sonhos',
      current: 8000,
      target: 15000,
      targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 dias
      priority: 'high',
      isCompleted: false
    }
  ];

  // Adicionar meta concluída
  const completedGoals = [
    {
      id: 'test-goal-2',
      name: 'Reserva de Emergência',
      description: 'Meta para emergências',
      current: 10000,
      target: 10000,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      isCompleted: false // Deixar false para simular meta recém atingida
    }
  ];

  // Adicionar viagem próxima
  const upcomingTrips = [
    {
      id: 'test-trip-1',
      name: 'Férias na Praia',
      destination: 'Maceió, AL',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias
      endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 3000,
      spent: 500,
      status: 'planned'
    }
  ];

  // Adicionar conta com muito dinheiro para sugerir investimento
  const highCashAccounts = [
    {
      id: 'test-savings-1',
      name: 'Poupança',
      type: 'savings',
      balance: 8000,
      bank: 'Itaú'
    }
  ];

  // Salvar no localStorage
  localStorage.setItem('sua-grana-transactions', JSON.stringify(highExpenseTransactions));
  localStorage.setItem('sua-grana-accounts', JSON.stringify([...lowBalanceAccounts, ...highCashAccounts]));
  localStorage.setItem('sua-grana-goals', JSON.stringify([...urgentGoals, ...completedGoals]));
  localStorage.setItem('sua-grana-trips', JSON.stringify(upcomingTrips));

  console.log('Dados de teste adicionados com sucesso!');
  console.log('Recarregue a página para ver as notificações.');
  
  return {
    transactions: highExpenseTransactions,
    accounts: [...lowBalanceAccounts, ...highCashAccounts],
    goals: [...urgentGoals, ...completedGoals],
    trips: upcomingTrips
  };
};

// Função para limpar dados de teste
export const clearTestData = () => {
  localStorage.removeItem('sua-grana-transactions');
  localStorage.removeItem('sua-grana-accounts');
  localStorage.removeItem('sua-grana-goals');
  localStorage.removeItem('sua-grana-trips');
  localStorage.removeItem('suagrana-notifications');
  
  console.log('Dados de teste removidos!');
  console.log('Recarregue a página para limpar as notificações.');
};

// Disponibilizar globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).addTestDataForNotifications = addTestDataForNotifications;
  (window as any).clearTestData = clearTestData;
}
