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

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor completo rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
  console.log(`📊 Transações: http://localhost:${port}/api/transactions`);
  console.log(`🏦 Contas: http://localhost:${port}/api/accounts`);
  console.log(`📈 Dashboard: http://localhost:${port}/api/dashboard/summary`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});