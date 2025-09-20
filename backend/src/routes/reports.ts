import { Router } from "express";
import { query, validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { ValidationError, asyncHandler } from "@/middleware/errorHandler";

import {
  cacheHeadersMiddleware,
  conditionalCacheMiddleware,
} from "@/middleware/cacheInvalidation";
import { reportService } from "@/services/reportService";
import { cacheService } from "@/services/cacheService";
import { logger, loggerUtils } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// Rota de teste
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Rota de relatórios funcionando!",
    timestamp: new Date().toISOString(),
  });
});

// Validações
const dateRangeValidation = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Data inicial deve estar no formato ISO 8601"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Data final deve estar no formato ISO 8601"),
  query("period")
    .optional()
    .isIn(["week", "month", "quarter", "year", "custom"])
    .withMessage("Período deve ser: week, month, quarter, year ou custom"),
];

const accountFilterValidation = [
  query("accountId")
    .optional()
    .isUUID()
    .withMessage("ID da conta deve ser um UUID válido"),
  query("accountType")
    .optional()
    .isIn(["CHECKING", "SAVINGS", "INVESTMENT", "CREDIT_CARD", "CASH", "OTHER"])
    .withMessage("Tipo de conta inválido"),
];

// Função para validar entrada
const validateInput = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error) => error.msg)
      .join(", ");
    throw new ValidationError(errorMessages);
  }
  next();
};

// Função para calcular período de datas
const calculateDateRange = (
  period?: string,
  startDate?: string,
  endDate?: string,
) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (period === "custom" && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    switch (period) {
      case "week":
        start.setDate(now.getDate() - 7);
        break;
      case "month":
        start.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(now.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1); // Default to last month
    }
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// GET /api/reports/dashboard - Dashboard principal
router.get(
  "/dashboard",
  cacheHeadersMiddleware(300, true), // 5 minutos, privado
  conditionalCacheMiddleware(),
  dateRangeValidation,
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const { period = "month", startDate, endDate } = req.query;
    const { start, end } = calculateDateRange(
      period as string,
      startDate as string,
      endDate as string,
    );

    // Buscar dados básicos
    const [accounts, transactions, investments, goals] = await Promise.all([
      // Contas
      prisma.account.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
        },
      }),

      // Transações do período
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          status: "COMPLETED",
        },
        select: {
          type: true,
          amount: true,
          category: true,
          date: true,
        },
      }),

      // Investimentos
      prisma.investment.findMany({
        where: { userId },
        select: {
          quantity: true,
          purchasePrice: true,
          currentPrice: true,
          type: true,
        },
      }),

      // Metas ativas
      prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        select: {
          targetAmount: true,
          currentAmount: true,
          targetDate: true,
        },
      }),
    ]);

    // Calcular totais de contas
    const accountTotals = accounts.reduce(
      (acc, account) => {
        const balance = Number(account.balance);
        acc.total += balance;
        acc.byType[account.type] = (acc.byType[account.type] || 0) + balance;
        return acc;
      },
      { total: 0, byType: {} as any },
    );

    // Calcular totais de transações
    const transactionTotals = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount);
        if (transaction.type === "INCOME") {
          acc.income += amount;
        } else if (transaction.type === "EXPENSE") {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );

    // Calcular totais de investimentos
    const investmentTotals = investments.reduce(
      (acc, investment) => {
        const quantity = Number(investment.quantity);
        const purchasePrice = Number(investment.purchasePrice);
        const currentPrice = Number(
          investment.currentPrice || investment.purchasePrice,
        );
        const invested = quantity * purchasePrice;
        const current = quantity * currentPrice;

        acc.totalInvested += invested;
        acc.currentValue += current;
        acc.gainLoss += current - invested;
        return acc;
      },
      { totalInvested: 0, currentValue: 0, gainLoss: 0 },
    );

    // Calcular totais de metas
    const goalTotals = goals.reduce(
      (acc, goal) => {
        const target = Number(goal.targetAmount);
        const current = Number(goal.currentAmount);
        acc.totalTarget += target;
        acc.totalCurrent += current;
        return acc;
      },
      { totalTarget: 0, totalCurrent: 0 },
    );

    // Agrupar transações por categoria
    const expensesByCategory = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as any);

    // Buscar transações recentes para o dashboard (últimas 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        category: true,
        date: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    // Agrupar transações por dia (últimos 30 dias)
    const dailyTransactions = transactions.reduce((acc, t) => {
      const dateKey = t.date.toISOString().split("T")[0];
      if (!acc[dateKey]) {
        acc[dateKey] = { income: 0, expense: 0 };
      }
      const amount = Number(t.amount);
      if (t.type === "INCOME") {
        acc[dateKey].income += amount;
      } else if (t.type === "EXPENSE") {
        acc[dateKey].expense += amount;
      }
      return acc;
    }, {} as any);

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        },
        summary: {
          accounts: {
            total: Math.round(accountTotals.total * 100) / 100,
            count: accounts.length,
            byType: Object.entries(accountTotals.byType).map(
              ([type, amount]) => ({
                type,
                amount: Math.round((amount as number) * 100) / 100,
              }),
            ),
          },
          transactions: {
            income: Math.round(transactionTotals.income * 100) / 100,
            expense: Math.round(transactionTotals.expense * 100) / 100,
            net:
              Math.round(
                (transactionTotals.income - transactionTotals.expense) * 100,
              ) / 100,
            count: transactions.length,
          },
          investments: {
            totalInvested:
              Math.round(investmentTotals.totalInvested * 100) / 100,
            currentValue: Math.round(investmentTotals.currentValue * 100) / 100,
            gainLoss: Math.round(investmentTotals.gainLoss * 100) / 100,
            gainLossPercentage:
              investmentTotals.totalInvested > 0
                ? Math.round(
                    (investmentTotals.gainLoss /
                      investmentTotals.totalInvested) *
                      10000,
                  ) / 100
                : 0,
            count: investments.length,
          },
          goals: {
            totalTarget: Math.round(goalTotals.totalTarget * 100) / 100,
            totalCurrent: Math.round(goalTotals.totalCurrent * 100) / 100,
            progress:
              goalTotals.totalTarget > 0
                ? Math.round(
                    (goalTotals.totalCurrent / goalTotals.totalTarget) * 10000,
                  ) / 100
                : 0,
            count: goals.length,
          },
        },
        charts: {
          expensesByCategory: Object.entries(expensesByCategory)
            .map(([category, amount]) => ({
              category,
              amount: Math.round((amount as number) * 100) / 100,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10),
          dailyFlow: Object.entries(dailyTransactions)
            .map(([date, data]: [string, any]) => ({
              date,
              income: Math.round(data.income * 100) / 100,
              expense: Math.round(data.expense * 100) / 100,
              net: Math.round((data.income - data.expense) * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        },
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          description: t.description,
          amount: Math.round(Number(t.amount) * 100) / 100,
          type: t.type.toLowerCase(),
          category: t.category,
          date: t.date.toISOString().split("T")[0],
        })),
      },
    });
  }),
);

// GET /api/reports/cash-flow - Relatório de fluxo de caixa
router.get(
  "/cash-flow",
  cacheHeadersMiddleware(600, true), // 10 minutos, privado
  conditionalCacheMiddleware(),
  dateRangeValidation,
  accountFilterValidation,
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const {
      period = "month",
      startDate,
      endDate,
      accountId,
      accountType,
    } = req.query;
    const { start, end } = calculateDateRange(
      period as string,
      startDate as string,
      endDate as string,
    );

    // Construir filtros
    const where: any = {
      userId,
      date: { gte: start, lte: end },
      status: "COMPLETED",
    };

    if (accountId) {
      where.accountId = accountId;
    } else if (accountType) {
      where.account = { type: accountType };
    }

    // Buscar transações
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
        category: true,
        date: true,
        account: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Agrupar por período (diário, semanal, mensal)
    const groupBy =
      period === "year" ? "month" : period === "quarter" ? "week" : "day";
    const grouped: any = {};

    transactions.forEach((transaction) => {
      let key: string;
      const date = new Date(transaction.date);

      if (groupBy === "day") {
        key = date.toISOString().split("T")[0];
      } else if (groupBy === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          income: 0,
          expense: 0,
          transfer: 0,
          net: 0,
          transactions: [],
        };
      }

      const amount = Number(transaction.amount);
      grouped[key].transactions.push(transaction);

      if (transaction.type === "INCOME") {
        grouped[key].income += amount;
      } else if (transaction.type === "EXPENSE") {
        grouped[key].expense += amount;
      } else if (transaction.type === "TRANSFER") {
        grouped[key].transfer += amount;
      }

      grouped[key].net = grouped[key].income - grouped[key].expense;
    });

    // Calcular totais
    const totals = Object.values(grouped).reduce(
      (acc: any, period: any) => {
        acc.income += period.income;
        acc.expense += period.expense;
        acc.transfer += period.transfer;
        return acc;
      },
      { income: 0, expense: 0, transfer: 0 },
    );

    totals.net = totals.income - totals.expense;

    // Agrupar por categoria
    const byCategory = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0, count: 0 };
      }
      const amount = Number(t.amount);
      if (t.type === "INCOME") {
        acc[t.category].income += amount;
      } else if (t.type === "EXPENSE") {
        acc[t.category].expense += amount;
      }
      acc[t.category].count += 1;
      return acc;
    }, {} as any);

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          groupBy,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        },
        totals: {
          income: Math.round(totals.income * 100) / 100,
          expense: Math.round(totals.expense * 100) / 100,
          transfer: Math.round(totals.transfer * 100) / 100,
          net: Math.round(totals.net * 100) / 100,
          transactionCount: transactions.length,
        },
        timeline: Object.entries(grouped)
          .map(([period, data]: [string, any]) => ({
            period,
            income: Math.round(data.income * 100) / 100,
            expense: Math.round(data.expense * 100) / 100,
            transfer: Math.round(data.transfer * 100) / 100,
            net: Math.round(data.net * 100) / 100,
            transactionCount: data.transactions.length,
          }))
          .sort((a, b) => a.period.localeCompare(b.period)),
        byCategory: Object.entries(byCategory)
          .map(([category, data]: [string, any]) => ({
            category,
            income: Math.round(data.income * 100) / 100,
            expense: Math.round(data.expense * 100) / 100,
            net: Math.round((data.income - data.expense) * 100) / 100,
            count: data.count,
          }))
          .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
      },
    });
  }),
);

// GET /api/reports/expenses - Relatório de despesas
router.get(
  "/expenses",
  cacheHeadersMiddleware(600, true), // 10 minutos, privado
  conditionalCacheMiddleware(),
  dateRangeValidation,
  accountFilterValidation,
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const {
      period = "month",
      startDate,
      endDate,
      accountId,
      accountType,
      category,
    } = req.query;
    const { start, end } = calculateDateRange(
      period as string,
      startDate as string,
      endDate as string,
    );

    // Construir filtros
    const where: any = {
      userId,
      type: "EXPENSE",
      date: { gte: start, lte: end },
      status: "COMPLETED",
    };

    if (accountId) where.accountId = accountId;
    if (accountType) where.account = { type: accountType };
    if (category) where.category = { contains: category, mode: "insensitive" };

    // Buscar despesas
    const expenses = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        category: true,
        description: true,
        date: true,
        account: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Calcular total
    const totalAmount = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    // Agrupar por categoria
    const byCategory = expenses.reduce((acc, expense) => {
      const cat = expense.category;
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0, percentage: 0, transactions: [] };
      }
      const amount = Number(expense.amount);
      acc[cat].total += amount;
      acc[cat].count += 1;
      acc[cat].transactions.push(expense);
      return acc;
    }, {} as any);

    // Calcular percentuais
    Object.values(byCategory).forEach((cat: any) => {
      cat.percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
      cat.total = Math.round(cat.total * 100) / 100;
      cat.percentage = Math.round(cat.percentage * 100) / 100;
      // Manter apenas as 5 maiores transações por categoria
      cat.transactions = cat.transactions
        .sort((a: any, b: any) => Number(b.amount) - Number(a.amount))
        .slice(0, 5);
    });

    // Agrupar por mês
    const byMonth = expenses.reduce((acc, expense) => {
      const monthKey = expense.date.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, count: 0 };
      }
      acc[monthKey].total += Number(expense.amount);
      acc[monthKey].count += 1;
      return acc;
    }, {} as any);

    // Top 10 maiores despesas
    const topExpenses = expenses
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 10)
      .map((expense) => ({
        ...expense,
        amount: Math.round(Number(expense.amount) * 100) / 100,
      }));

    res.json({
      success: true,
      data: {
        period: {
          type: period,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        },
        summary: {
          totalAmount: Math.round(totalAmount * 100) / 100,
          transactionCount: expenses.length,
          averagePerTransaction:
            expenses.length > 0
              ? Math.round((totalAmount / expenses.length) * 100) / 100
              : 0,
          categoriesCount: Object.keys(byCategory).length,
        },
        byCategory: Object.entries(byCategory)
          .map(([category, data]: [string, any]) => ({
            category,
            ...data,
          }))
          .sort((a, b) => b.total - a.total),
        byMonth: Object.entries(byMonth)
          .map(([month, data]: [string, any]) => ({
            month,
            total: Math.round(data.total * 100) / 100,
            count: data.count,
            average: Math.round((data.total / data.count) * 100) / 100,
          }))
          .sort((a, b) => a.month.localeCompare(b.month)),
        topExpenses,
      },
    });
  }),
);

// GET /api/reports/investments - Relatório de investimentos
router.get(
  "/investments",
  cacheHeadersMiddleware(900, true), // 15 minutos, privado
  conditionalCacheMiddleware(),
  query("type")
    .optional()
    .isIn(["STOCK", "BOND", "FUND", "ETF", "CRYPTO", "REAL_ESTATE", "OTHER"])
    .withMessage("Tipo de investimento inválido"),
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const { type } = req.query;

    // Construir filtros
    const where: any = { userId };
    if (type) where.type = type;

    // Buscar investimentos
    const investments = await prisma.investment.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        name: true,
        type: true,
        quantity: true,
        purchasePrice: true,
        currentPrice: true,
        purchaseDate: true,
        dividends: {
          select: {
            amount: true,
            paymentDate: true,
          },
        },
      },
    });

    // Calcular métricas para cada investimento
    const investmentsWithMetrics = investments.map((inv) => {
      const quantity = Number(inv.quantity);
      const purchasePrice = Number(inv.purchasePrice);
      const currentPrice = Number(inv.currentPrice || inv.purchasePrice);
      const totalInvested = quantity * purchasePrice;
      const currentValue = quantity * currentPrice;
      const gainLoss = currentValue - totalInvested;
      const gainLossPercentage =
        totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
      const totalDividends = inv.dividends.reduce(
        (sum, div) => sum + Number(div.amount),
        0,
      );
      const dividendYield =
        totalInvested > 0 ? (totalDividends / totalInvested) * 100 : 0;

      return {
        ...inv,
        metrics: {
          totalInvested: Math.round(totalInvested * 100) / 100,
          currentValue: Math.round(currentValue * 100) / 100,
          gainLoss: Math.round(gainLoss * 100) / 100,
          gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
          totalDividends: Math.round(totalDividends * 100) / 100,
          dividendYield: Math.round(dividendYield * 100) / 100,
        },
      };
    });

    // Calcular totais da carteira
    const portfolioTotals = investmentsWithMetrics.reduce(
      (acc, inv) => {
        acc.totalInvested += inv.metrics.totalInvested;
        acc.currentValue += inv.metrics.currentValue;
        acc.gainLoss += inv.metrics.gainLoss;
        acc.totalDividends += inv.metrics.totalDividends;
        return acc;
      },
      { totalInvested: 0, currentValue: 0, gainLoss: 0, totalDividends: 0 },
    );

    const portfolioGainLossPercentage =
      portfolioTotals.totalInvested > 0
        ? (portfolioTotals.gainLoss / portfolioTotals.totalInvested) * 100
        : 0;

    const portfolioDividendYield =
      portfolioTotals.totalInvested > 0
        ? (portfolioTotals.totalDividends / portfolioTotals.totalInvested) * 100
        : 0;

    // Agrupar por tipo
    const byType = investmentsWithMetrics.reduce((acc, inv) => {
      if (!acc[inv.type]) {
        acc[inv.type] = {
          count: 0,
          totalInvested: 0,
          currentValue: 0,
          gainLoss: 0,
        };
      }
      acc[inv.type].count += 1;
      acc[inv.type].totalInvested += inv.metrics.totalInvested;
      acc[inv.type].currentValue += inv.metrics.currentValue;
      acc[inv.type].gainLoss += inv.metrics.gainLoss;
      return acc;
    }, {} as any);



    // Top performers
    const topPerformers = investmentsWithMetrics
      .sort(
        (a, b) => b.metrics.gainLossPercentage - a.metrics.gainLossPercentage,
      )
      .slice(0, 10);

    // Worst performers
    const worstPerformers = investmentsWithMetrics
      .sort(
        (a, b) => a.metrics.gainLossPercentage - b.metrics.gainLossPercentage,
      )
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        portfolio: {
          totalInvestments: investments.length,
          totalInvested: Math.round(portfolioTotals.totalInvested * 100) / 100,
          currentValue: Math.round(portfolioTotals.currentValue * 100) / 100,
          gainLoss: Math.round(portfolioTotals.gainLoss * 100) / 100,
          gainLossPercentage:
            Math.round(portfolioGainLossPercentage * 100) / 100,
          totalDividends:
            Math.round(portfolioTotals.totalDividends * 100) / 100,
          dividendYield: Math.round(portfolioDividendYield * 100) / 100,
        },
        allocation: {
          byType: Object.entries(byType).map(([type, data]: [string, any]) => ({
            type,
            count: data.count,
            totalInvested: Math.round(data.totalInvested * 100) / 100,
            currentValue: Math.round(data.currentValue * 100) / 100,
            gainLoss: Math.round(data.gainLoss * 100) / 100,
            percentage:
              portfolioTotals.totalInvested > 0
                ? Math.round(
                    (data.totalInvested / portfolioTotals.totalInvested) *
                      10000,
                  ) / 100
                : 0,
          })),
        },
        performance: {
          topPerformers: topPerformers.map((inv) => ({
            symbol: inv.symbol,
            name: inv.name,
            gainLossPercentage: inv.metrics.gainLossPercentage,
            gainLoss: inv.metrics.gainLoss,
          })),
          worstPerformers: worstPerformers.map((inv) => ({
            symbol: inv.symbol,
            name: inv.name,
            gainLossPercentage: inv.metrics.gainLossPercentage,
            gainLoss: inv.metrics.gainLoss,
          })),
        },
        investments: investmentsWithMetrics,
      },
    });
  }),
);

// GET /api/reports/goals - Relatório de metas
router.get(
  "/goals",
  cacheHeadersMiddleware(600, true), // 10 minutos, privado
  conditionalCacheMiddleware(),
  query("status")
    .optional()
    .isIn(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"])
    .withMessage("Status deve ser ACTIVE, COMPLETED, PAUSED ou CANCELLED"),
  query("category")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Categoria deve ter entre 1 e 50 caracteres"),
  validateInput,
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const { status, category } = req.query;

    // Construir filtros
    const where: any = { userId };
    if (status) where.status = status;
    if (category) where.category = { contains: category, mode: "insensitive" };

    // Buscar metas
    const goals = await prisma.goal.findMany({
      where,
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        targetDate: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
      },
    });

    // Calcular métricas para cada meta
    const goalsWithMetrics = goals.map((goal) => {
      const currentAmount = Number(goal.currentAmount);
      const targetAmount = Number(goal.targetAmount);
      const progress =
        targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const remaining = Math.max(targetAmount - currentAmount, 0);

      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      const createdDate = new Date(goal.createdAt);

      const totalDays = Math.ceil(
        (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysRemaining = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const elapsedDays = totalDays - daysRemaining;

      const expectedProgress =
        elapsedDays > 0 && totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
      const progressVsExpected = progress - expectedProgress;

      return {
        ...goal,
        metrics: {
          progress: Math.min(Math.round(progress * 100) / 100, 100),
          remaining: Math.round(remaining * 100) / 100,
          daysRemaining,
          totalDays,
          elapsedDays,
          expectedProgress: Math.round(expectedProgress * 100) / 100,
          progressVsExpected: Math.round(progressVsExpected * 100) / 100,
          isOverdue: daysRemaining < 0,
          isOnTrack: progressVsExpected >= -10, // Tolerância de 10%
          dailyTargetAmount:
            daysRemaining > 0
              ? Math.round((remaining / daysRemaining) * 100) / 100
              : 0,
        },
      };
    });

    // Calcular estatísticas gerais
    const totalTargetAmount = goals.reduce(
      (sum, goal) => sum + Number(goal.targetAmount),
      0,
    );
    const totalCurrentAmount = goals.reduce(
      (sum, goal) => sum + Number(goal.currentAmount),
      0,
    );
    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    // Agrupar por status
    const byStatus = goals.reduce((acc, goal) => {
      if (!acc[goal.status]) {
        acc[goal.status] = { count: 0, totalTarget: 0, totalCurrent: 0 };
      }
      acc[goal.status].count += 1;
      acc[goal.status].totalTarget += Number(goal.targetAmount);
      acc[goal.status].totalCurrent += Number(goal.currentAmount);
      return acc;
    }, {} as any);

    // Agrupar por categoria
    const byCategory = goals.reduce((acc, goal) => {
      const cat = goal.category || "Sem categoria";
      if (!acc[cat]) {
        acc[cat] = { count: 0, totalTarget: 0, totalCurrent: 0 };
      }
      acc[cat].count += 1;
      acc[cat].totalTarget += Number(goal.targetAmount);
      acc[cat].totalCurrent += Number(goal.currentAmount);
      return acc;
    }, {} as any);

    // Metas que precisam de atenção
    const needsAttention = goalsWithMetrics.filter(
      (g) =>
        g.status === "ACTIVE" && (g.metrics.isOverdue || !g.metrics.isOnTrack),
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalGoals: goals.length,
          totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
          totalCurrentAmount: Math.round(totalCurrentAmount * 100) / 100,
          overallProgress: Math.round(overallProgress * 100) / 100,
          needsAttentionCount: needsAttention.length,
        },
        byStatus: Object.entries(byStatus).map(
          ([status, data]: [string, any]) => ({
            status,
            count: data.count,
            totalTarget: Math.round(data.totalTarget * 100) / 100,
            totalCurrent: Math.round(data.totalCurrent * 100) / 100,
            progress:
              data.totalTarget > 0
                ? Math.round((data.totalCurrent / data.totalTarget) * 10000) /
                  100
                : 0,
          }),
        ),
        byCategory: Object.entries(byCategory).map(
          ([category, data]: [string, any]) => ({
            category,
            count: data.count,
            totalTarget: Math.round(data.totalTarget * 100) / 100,
            totalCurrent: Math.round(data.totalCurrent * 100) / 100,
            progress:
              data.totalTarget > 0
                ? Math.round((data.totalCurrent / data.totalTarget) * 10000) /
                  100
                : 0,
          }),
        ),
        needsAttention: needsAttention.map((goal) => ({
          id: goal.id,
          name: goal.name,
          progress: goal.metrics.progress,
          daysRemaining: goal.metrics.daysRemaining,
          dailyTargetAmount: goal.metrics.dailyTargetAmount,
          isOverdue: goal.metrics.isOverdue,
          progressVsExpected: goal.metrics.progressVsExpected,
        })),
        goals: goalsWithMetrics,
      },
    });
  }),
);

// POST /api/reports/cache/invalidate - Invalidar cache de relatórios
router.post(
  "/cache/invalidate",
  asyncHandler(async (req, res) => {
    const userId = "demo-user-1";
    const { type } = req.body;

    try {
      if (
        type &&
        ["dashboard", "cash-flow", "expenses", "investments", "goals"].includes(
          type,
        )
      ) {
        await reportService.invalidateReportsByType(userId, type as any);
        logger.info("Reports cache invalidated by type", { userId, type });
      } else {
        await reportService.invalidateUserReports(userId);
        logger.info("All user reports cache invalidated", { userId });
      }

      res.json({
        success: true,
        message: "Cache invalidado com sucesso",
        data: {
          type: type || "all",
          userId,
        },
      });
    } catch (error) {
      logger.error("Cache invalidation failed", { userId, type, error });
      throw error;
    }
  }),
);

// GET /api/reports/cache/stats - Estatísticas do cache
router.get(
  "/cache/stats",
  asyncHandler(async (req, res) => {
    try {
      const stats = reportService.getCacheStats();
      const redisInfo = await cacheService.getRedisInfo();

      res.json({
        success: true,
        data: {
          cache: stats,
          redis: redisInfo,
        },
      });
    } catch (error) {
      logger.error("Get cache stats failed", { error });
      throw error;
    }
  }),
);

// DELETE /api/reports/cache - Limpar todo o cache de relatórios
router.delete(
  "/cache",
  asyncHandler(async (req, res) => {
    try {
      await reportService.invalidateAllReports();
      logger.info("All reports cache cleared");

      res.json({
        success: true,
        message: "Todo o cache de relatórios foi limpo",
      });
    } catch (error) {
      logger.error("Clear all cache failed", { error });
      throw error;
    }
  }),
);

export default router;
