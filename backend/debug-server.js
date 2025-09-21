const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Dados de exemplo mais realistas
const sampleTransactions = [
  {
    id: 1,
    description: "Salário",
    amount: 5000,
    type: "income",
    category: "Trabalho",
    date: "2025-09-15",
    account: "Conta Corrente"
  },
  {
    id: 2,
    description: "Supermercado",
    amount: -350,
    type: "expense",
    category: "Alimentação",
    date: "2025-09-14",
    account: "Cartão de Crédito"
  },
  {
    id: 3,
    description: "Aluguel",
    amount: -1200,
    type: "expense",
    category: "Moradia",
    date: "2025-09-01",
    account: "Conta Corrente"
  },
  {
    id: 4,
    description: "Freelance",
    amount: 800,
    type: "income",
    category: "Trabalho Extra",
    date: "2025-09-10",
    account: "Conta Poupança"
  }
];

const sampleAccounts = [
  {
    id: 1,
    name: "Conta Corrente",
    balance: 2500,
    type: "checking"
  },
  {
    id: 2,
    name: "Conta Poupança",
    balance: 15000,
    type: "savings"
  },
  {
    id: 3,
    name: "Cartão de Crédito",
    balance: -850,
    type: "credit"
  }
];

// Rotas básicas de transações
app.get('/api/transactions', (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedTransactions = sampleTransactions.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: sampleTransactions.length,
        totalPages: Math.ceil(sampleTransactions.length / limitNum),
        hasNext: endIndex < sampleTransactions.length,
        hasPrev: pageNum > 1
      },
      summary: {
        totalTransactions: sampleTransactions.length,
        totalIncome: sampleTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: sampleTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
      }
    }
  });
});

// Rota de summary de transações
app.get('/api/transactions/summary', (req, res) => {
  const { year, month, type } = req.query;
  
  let filteredTransactions = sampleTransactions;
  
  if (type) {
    filteredTransactions = filteredTransactions.filter(t => t.type === type);
  }
  
  const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const total = income - expenses;
  const count = filteredTransactions.length;
  
  res.json({
    success: true,
    data: {
      income,
      expenses,
      balance: total,
      transactionCount: count,
      averageTransaction: count > 0 ? total / count : 0,
      type: type || 'all',
      period: { year, month }
    }
  });
});

// Rotas de contas
app.get('/api/accounts', (req, res) => {
  res.json({
    success: true,
    data: {
      accounts: sampleAccounts,
      total: sampleAccounts.length
    }
  });
});

app.get('/api/accounts/summary', (req, res) => {
  const totalBalance = sampleAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const positiveBalance = sampleAccounts
    .filter(acc => acc.balance > 0)
    .reduce((sum, acc) => sum + acc.balance, 0);
  const negativeBalance = sampleAccounts
    .filter(acc => acc.balance < 0)
    .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  
  res.json({
    success: true,
    data: {
      totalBalance,
      positiveBalance,
      negativeBalance,
      accountCount: sampleAccounts.length
    }
  });
});

// Rotas de investimentos
app.get('/api/investments/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalValue: 25000,
      totalInvested: 20000,
      totalReturn: 5000,
      returnPercentage: 25,
      investments: [
        {
          name: "Tesouro Direto",
          value: 15000,
          return: 3000
        },
        {
          name: "Ações",
          value: 10000,
          return: 2000
        }
      ]
    }
  });
});

// Rota para listar investimentos
app.get('/api/investments', (req, res) => {
  res.json({
    success: true,
    data: {
      investments: [
        {
          id: 1,
          name: "Tesouro Direto IPCA+ 2029",
          type: "Renda Fixa",
          quantity: 10,
          currentPrice: 1500,
          totalValue: 15000,
          purchasePrice: 1200,
          totalInvested: 12000,
          return: 3000,
          returnPercentage: 25,
          broker: "XP Investimentos",
          purchaseDate: "2024-01-15"
        },
        {
          id: 2,
          name: "PETR4",
          type: "Ações",
          quantity: 100,
          currentPrice: 100,
          totalValue: 10000,
          purchasePrice: 80,
          totalInvested: 8000,
          return: 2000,
          returnPercentage: 25,
          broker: "Rico",
          purchaseDate: "2024-03-10"
        }
      ],
      total: 2
    }
  });
});

// Rotas de relatórios
app.get('/api/reports/category-spending', (req, res) => {
  const { startDate, endDate } = req.query;
  
  res.json({
    success: true,
    data: {
      categories: [
        { name: 'Alimentação', total: 800, percentage: 40, transactions: 15 },
        { name: 'Transporte', total: 400, percentage: 20, transactions: 8 },
        { name: 'Lazer', total: 300, percentage: 15, transactions: 5 },
        { name: 'Saúde', total: 250, percentage: 12.5, transactions: 3 },
        { name: 'Outros', total: 250, percentage: 12.5, transactions: 4 }
      ],
      total: 2000,
      period: { startDate, endDate }
    }
  });
});

app.get('/api/reports/cash-flow', (req, res) => {
  const { year, month, startDate, endDate } = req.query;
  
  // Dados de fluxo de caixa dos últimos 6 meses
  const monthlyData = [
    { month: 'abr', income: 5200, expenses: 4770.40, netFlow: 429.60 },
    { month: 'mai', income: 5400, expenses: 4967.39, netFlow: 432.61 },
    { month: 'jun', income: 5600, expenses: 4856.66, netFlow: 743.34 },
    { month: 'jul', income: 5800, expenses: 4756.74, netFlow: 1043.26 },
    { month: 'ago', income: 5900, expenses: 5339.42, netFlow: 560.58 },
    { month: 'set', income: 5800, expenses: 5528.04, netFlow: 271.96 }
  ];
  
  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  
  res.json({
    success: true,
    data: {
      income: totalIncome,
      expenses: totalExpenses,
      netFlow: totalIncome - totalExpenses,
      monthlyData: monthlyData,
      dailyFlow: [
        { date: '2025-09-01', income: 0, expenses: 120, balance: -120 },
        { date: '2025-09-02', income: 5000, expenses: 80, balance: 4920 },
        { date: '2025-09-03', income: 0, expenses: 200, balance: -200 },
        { date: '2025-09-04', income: 0, expenses: 150, balance: -150 },
        { date: '2025-09-05', income: 0, expenses: 300, balance: -300 }
      ],
      period: { year, month, startDate, endDate }
    }
  });
});

app.get('/api/reports/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: {
        totalIncome: 5674.18,
        totalExpenses: 2192.84,
        netFlow: 3481.34,
        savingsRate: 73.3
      },
      topCategories: [
        { name: 'Alimentação', amount: 800, percentage: 36.5 },
        { name: 'Transporte', amount: 400, percentage: 18.2 },
        { name: 'Lazer', amount: 300, percentage: 13.7 }
      ],
      monthlyTrend: [
        { month: 'Jul', income: 5800, expenses: 4756.74 },
        { month: 'Ago', income: 5900, expenses: 5339.42 },
        { month: 'Set', income: 5800, expenses: 1550 }
      ]
    }
  });
});

// Rota de dashboard summary
app.get('/api/dashboard/summary', (req, res) => {
  res.json({
    success: true,
    data: {
      totalBalance: 16650,
      monthlyIncome: 5800,
      monthlyExpenses: 1550,
      monthlyResult: 4250,
      savingsRate: 73.3,
      accountsCount: 3,
      transactionsCount: 4,
      investmentsValue: 25000,
      goalsProgress: 0,
      activeGoals: 0,
      completedGoals: 0,
      recentTransactions: [
        { id: 1, description: 'Salário', amount: 5000, date: '2025-09-15', category: 'Trabalho' },
        { id: 2, description: 'Supermercado', amount: -350, date: '2025-09-14', category: 'Alimentação' },
        { id: 3, description: 'Aluguel', amount: -1200, date: '2025-09-01', category: 'Moradia' },
        { id: 4, description: 'Freelance', amount: 800, date: '2025-09-10', category: 'Trabalho Extra' }
      ],
      upcomingBills: [
        { id: 1, description: 'Aluguel', amount: 1200, dueDate: '2025-10-01' },
        { id: 2, description: 'Internet', amount: 80, dueDate: '2025-09-25' }
      ]
    }
  });
});

// Rotas de metas
app.get('/api/goals/progress', (req, res) => {
  res.json({
    success: true,
    data: {
      totalGoals: 0,
      completedGoals: 0,
      averageProgress: 0,
      goals: []
    }
  });
});

// Rota para listar todas as metas
app.get('/api/goals', (req, res) => {
  res.json({
    success: true,
    data: {
      goals: [],
      total: 0,
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  });
});

// Rota de resumo de transações por tipo e período
app.get('/api/transactions/summary', (req, res) => {
  const { year, month, type, startDate, endDate } = req.query;
  
  // Dados baseados no tipo de transação
  let data = {};
  
  if (type === 'income') {
    data = {
      total: 5800,
      count: 2,
      average: 2900,
      growth: 0.0,
      transactions: [
        { id: 1, description: 'Salário', amount: 5000, date: '2025-09-15', category: 'Trabalho' },
        { id: 4, description: 'Freelance', amount: 800, date: '2025-09-10', category: 'Trabalho Extra' }
      ]
    };
  } else if (type === 'expense') {
    data = {
      total: 1550,
      count: 2,
      average: 775,
      growth: 0.0,
      transactions: [
        { id: 2, description: 'Supermercado', amount: 350, date: '2025-09-14', category: 'Alimentação' },
        { id: 3, description: 'Aluguel', amount: 1200, date: '2025-09-01', category: 'Moradia' }
      ]
    };
  } else {
    // Resumo geral
    data = {
      totalIncome: 5800,
      totalExpenses: 1550,
      netFlow: 4250,
      transactionCount: 4,
      incomeCount: 2,
      expenseCount: 2,
      averageIncome: 2900,
      averageExpense: 775,
      savingsRate: 73.3
    };
  }
  
  res.json({
    success: true,
    data: data,
    period: { year, month, type, startDate, endDate }
  });
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor completo funcionando!', timestamp: new Date().toISOString() });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor completo rodando na porta ${PORT}`);
  console.log(`📊 Rotas disponíveis:`);
  console.log(`   GET /api/transactions`);
  console.log(`   GET /api/transactions/summary`);
  console.log(`   GET /api/accounts`);
  console.log(`   GET /api/accounts/summary`);
  console.log(`   GET /api/investments/summary`);
  console.log(`   GET /api/reports/category-spending`);
  console.log(`   GET /api/reports/cash-flow`);
  console.log(`   GET /api/reports/dashboard`);
  console.log(`   GET /api/dashboard/summary`);
  console.log(`   GET /api/goals/progress`);
  console.log(`   GET /test`);
});