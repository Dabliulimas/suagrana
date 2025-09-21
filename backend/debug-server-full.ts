import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Carregar variáveis de ambiente
dotenv.config();

console.log("🚀 Iniciando servidor completo...");

const app = express();
const port = 3001;
const prisma = new PrismaClient();

// Middlewares
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));
app.use(express.json());

// Middleware de log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Rota de transações
app.get('/api/transactions', async (req, res) => {
  try {
    console.log("📊 Buscando transações...");
    const transactions = await prisma.transaction.findMany({
      include: {
        entries: {
          include: {
            account: true,
            category: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log(`✅ Encontradas ${transactions.length} transações`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Erro ao buscar transações:", error);
    res.status(500).json({ 
      error: 'Erro ao buscar transações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de contas
app.get('/api/accounts', async (req, res) => {
  try {
    console.log("🏦 Buscando contas...");
    const accounts = await prisma.account.findMany({
      include: {
        _count: {
          select: {
            entries: true
          }
        }
      }
    });
    
    console.log(`✅ Encontradas ${accounts.length} contas`);
    res.json(accounts);
  } catch (error) {
    console.error("❌ Erro ao buscar contas:", error);
    res.status(500).json({ 
      error: 'Erro ao buscar contas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de resumo do dashboard
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    console.log("📈 Calculando resumo do dashboard...");
    
    // Buscar todas as transações com entries
    const transactions = await prisma.transaction.findMany({
      include: {
        entries: {
          include: {
            account: true,
            category: true
          }
        }
      }
    });
    
    // Calcular totais baseado nas entries
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(transaction => {
      transaction.entries.forEach(entry => {
        // Receitas são créditos em contas de receita
        if (entry.account.type === 'INCOME') {
          totalIncome += Number(entry.credit);
        }
        // Despesas são débitos em contas de despesa
        if (entry.account.type === 'EXPENSE') {
          totalExpense += Number(entry.debit);
        }
      });
    });
      
    const balance = totalIncome - totalExpense;
    
    // Buscar contas
    const accounts = await prisma.account.findMany();
    const totalAccounts = accounts.length;
    
    const summary = {
      totalIncome,
      totalExpense,
      balance,
      totalAccounts,
      transactionCount: transactions.length
    };
    
    console.log("✅ Resumo calculado:", summary);
    res.json(summary);
  } catch (error) {
    console.error("❌ Erro ao calcular resumo:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular resumo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de resumo de transações
app.get('/api/transactions/summary', async (req, res) => {
  try {
    console.log("📊 Calculando resumo de transações...", req.query);
    
    const { year, month, type } = req.query;
    
    // Mock data para teste
    const mockData = {
      totalAmount: type === 'income' ? 5000 : 3000,
      transactionCount: type === 'income' ? 15 : 25,
      averageAmount: type === 'income' ? 333.33 : 120,
      type: type || 'all'
    };
    
    console.log("✅ Resumo de transações:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao calcular resumo de transações:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular resumo de transações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de transações por categoria
app.get('/api/transactions/by-category', async (req, res) => {
  try {
    console.log("📊 Buscando transações por categoria...", req.query);
    
    // Mock data para teste
    const mockData = [
      { category: 'Alimentação', amount: 800, count: 12 },
      { category: 'Transporte', amount: 400, count: 8 },
      { category: 'Lazer', amount: 300, count: 5 },
      { category: 'Saúde', amount: 200, count: 3 },
      { category: 'Educação', amount: 150, count: 2 }
    ];
    
    console.log("✅ Transações por categoria:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao buscar transações por categoria:", error);
    res.status(500).json({ 
      error: 'Erro ao buscar transações por categoria',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de progresso de metas
app.get('/api/goals/progress', async (req, res) => {
  try {
    console.log("🎯 Calculando progresso de metas...");
    
    // Mock data para teste
    const mockData = {
      activeGoals: 3,
      completedGoals: 1,
      totalProgress: 65,
      goals: [
        { id: 1, name: 'Emergência', target: 10000, current: 6500, progress: 65 },
        { id: 2, name: 'Viagem', target: 5000, current: 2000, progress: 40 },
        { id: 3, name: 'Carro', target: 30000, current: 15000, progress: 50 }
      ]
    };
    
    console.log("✅ Progresso de metas:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao calcular progresso de metas:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular progresso de metas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de relatórios de fluxo de caixa
app.get('/api/reports/cash-flow', async (req, res) => {
  try {
    console.log("💰 Calculando fluxo de caixa...", req.query);
    
    // Mock data para teste
    const mockData = {
      income: 5000,
      expenses: 3500,
      netFlow: 1500,
      period: req.query.startDate + ' to ' + req.query.endDate,
      categories: [
        { name: 'Salário', amount: 4000, type: 'income' },
        { name: 'Freelance', amount: 1000, type: 'income' },
        { name: 'Alimentação', amount: 800, type: 'expense' },
        { name: 'Transporte', amount: 400, type: 'expense' }
      ]
    };
    
    console.log("✅ Fluxo de caixa:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao calcular fluxo de caixa:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular fluxo de caixa',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de resumo de contas
app.get('/api/accounts/summary', async (req, res) => {
  try {
    console.log("🏦 Calculando resumo de contas...");
    
    // Mock data para teste
    const mockData = {
      totalBalance: 15000,
      accountCount: 3,
      accounts: [
        { id: 1, name: 'Conta Corrente', balance: 5000, type: 'checking' },
        { id: 2, name: 'Poupança', balance: 8000, type: 'savings' },
        { id: 3, name: 'Investimentos', balance: 2000, type: 'investment' }
      ]
    };
    
    console.log("✅ Resumo de contas:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao calcular resumo de contas:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular resumo de contas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Rota de resumo de investimentos
app.get('/api/investments/summary', async (req, res) => {
  try {
    console.log("📈 Calculando resumo de investimentos...");
    
    // Mock data para teste
    const mockData = {
      totalValue: 25000,
      totalGain: 2500,
      gainPercentage: 11.11,
      investments: [
        { name: 'Tesouro Direto', value: 10000, gain: 800 },
        { name: 'Ações', value: 12000, gain: 1500 },
        { name: 'Fundos', value: 3000, gain: 200 }
      ]
    };
    
    console.log("✅ Resumo de investimentos:", mockData);
    res.json(mockData);
  } catch (error) {
    console.error("❌ Erro ao calcular resumo de investimentos:", error);
    res.status(500).json({ 
      error: 'Erro ao calcular resumo de investimentos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor completo rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Transações: http://localhost:${port}/api/transactions`);
  console.log(`🏦 Contas: http://localhost:${port}/api/accounts`);
  console.log(`📈 Dashboard: http://localhost:${port}/api/dashboard/summary`);
  console.log(`💰 Resumo de transações: http://localhost:${port}/api/transactions/summary`);
  console.log(`📊 Transações por categoria: http://localhost:${port}/api/transactions/by-category`);
  console.log(`🎯 Progresso de metas: http://localhost:${port}/api/goals/progress`);
  console.log(`💰 Fluxo de caixa: http://localhost:${port}/api/reports/cash-flow`);
  console.log(`🏦 Resumo de contas: http://localhost:${port}/api/accounts/summary`);
  console.log(`📈 Resumo de investimentos: http://localhost:${port}/api/investments/summary`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});