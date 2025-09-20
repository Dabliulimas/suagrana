import {
  PrismaClient,
  TransactionType,
  TransactionStatus,
  InvestmentType,
  GoalStatus,
} from "@prisma/client";
import { logger } from "../utils/logger";
import { accountService } from "./accountService";
import { transactionService } from "./transactionService";
import { investmentService } from "./investmentService";
import { goalService } from "./goalService";
import { cacheService } from "./cacheService";

const prisma = new PrismaClient();

export interface DashboardData {
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    totalInvested: number;
    investmentValue: number;
    investmentGainLoss: number;
    totalGoals: number;
    completedGoals: number;
    goalsProgress: number;
  };
  charts: {
    expensesByCategory: Array<{
      category: string;
      amount: number;
      percentage: number;
      color?: string;
    }>;
    dailyCashFlow: Array<{
      date: string;
      income: number;
      expense: number;
      net: number;
    }>;
    accountsBalance: Array<{
      accountName: string;
      accountType: string;
      balance: number;
      percentage: number;
    }>;
    investmentAllocation: Array<{
      type: InvestmentType;
      value: number;
      percentage: number;
    }>;
  };
  recentTransactions: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: string;
    date: Date;
    accountName: string;
  }>;
}

export interface CashFlowReport {
  period: {
    startDate: Date;
    endDate: Date;
    groupBy: "day" | "week" | "month";
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalTransfer: number;
    netCashFlow: number;
    averageDailyIncome: number;
    averageDailyExpense: number;
  };
  timeline: Array<{
    period: string;
    income: number;
    expense: number;
    transfer: number;
    net: number;
    count: number;
  }>;
  byCategory: Array<{
    category: string;
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
    percentage: number;
  }>;
  byAccount: Array<{
    accountId: string;
    accountName: string;
    accountType: string;
    income: number;
    expense: number;
    transfer: number;
    net: number;
  }>;
}

export interface ExpenseReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalExpenses: number;
    transactionCount: number;
    averageExpense: number;
    dailyAverage: number;
  };
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
    averageAmount: number;
  }>;
  byMonth: Array<{
    month: string;
    amount: number;
    count: number;
    averageAmount: number;
  }>;
  topExpenses: Array<{
    id: string;
    description: string;
    category: string;
    amount: number;
    date: Date;
    accountName: string;
  }>;
  trends: {
    monthlyGrowth: number;
    categoryTrends: Array<{
      category: string;
      trend: "increasing" | "decreasing" | "stable";
      changePercentage: number;
    }>;
  };
}

export interface InvestmentReport {
  portfolio: {
    totalInvested: number;
    currentValue: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
    totalDividends: number;
    totalDividendYield: number;
    totalInvestments: number;
  };
  investments: Array<{
    id: string;
    symbol: string;
    name: string;
    type: InvestmentType;
    sector?: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    totalInvested: number;
    currentValue: number;
    gainLoss: number;
    gainLossPercentage: number;
    totalDividends: number;
    dividendYield: number;
  }>;
  allocation: {
    byType: Array<{
      type: InvestmentType;
      count: number;
      totalInvested: number;
      currentValue: number;
      percentage: number;
      gainLoss: number;
      gainLossPercentage: number;
    }>;
    bySector: Array<{
      sector: string;
      count: number;
      totalInvested: number;
      currentValue: number;
      percentage: number;
      gainLoss: number;
      gainLossPercentage: number;
    }>;
  };
  performance: {
    topPerformers: Array<{
      symbol: string;
      name: string;
      gainLossPercentage: number;
      gainLoss: number;
    }>;
    worstPerformers: Array<{
      symbol: string;
      name: string;
      gainLossPercentage: number;
      gainLoss: number;
    }>;
  };
  dividends: {
    totalReceived: number;
    monthlyAverage: number;
    byMonth: Array<{
      month: string;
      amount: number;
      count: number;
    }>;
    topDividendPayers: Array<{
      symbol: string;
      name: string;
      totalDividends: number;
      dividendYield: number;
    }>;
  };
}

export interface GoalsReport {
  overview: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    pausedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  };
  goals: Array<{
    id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    category?: string;
    priority: number;
    status: GoalStatus;
    progressPercentage: number;
    remainingAmount: number;
    daysRemaining: number;
    dailyTargetAmount: number;
    isOverdue: boolean;
    progressVsExpected: number;
  }>;
  analytics: {
    averageCompletionTime: number;
    successRate: number;
    averageGoalAmount: number;
    totalSaved: number;
  };
  byStatus: Array<{
    status: GoalStatus;
    count: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    averageProgress: number;
  }>;
  alerts: {
    urgentGoals: Array<{
      id: string;
      name: string;
      daysRemaining: number;
      progressPercentage: number;
    }>;
    overdueGoals: Array<{
      id: string;
      name: string;
      daysOverdue: number;
      progressPercentage: number;
    }>;
    nearCompletionGoals: Array<{
      id: string;
      name: string;
      progressPercentage: number;
      remainingAmount: number;
    }>;
  };
}

class ReportService {
  /**
   * Gera dashboard principal com cache
   */
  async getDashboard(
    userId: string,
    period: { startDate?: Date; endDate?: Date } = {},
  ): Promise<DashboardData> {
    try {
      const endDate = period.endDate || new Date();
      const startDate =
        period.startDate ||
        new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      // Gerar chave de cache baseada nos parâmetros
      const cacheKey = `dashboard:${userId}:${startDate.toISOString().split("T")[0]}:${endDate.toISOString().split("T")[0]}`;

      // Tentar obter do cache
      return await cacheService.remember(
        cacheKey,
        async () => this.generateDashboard(userId, startDate, endDate),
        {
          ttl: 300, // 5 minutos
          tags: [`user:${userId}`, "dashboard", "reports"],
        },
      );
    } catch (error) {
      logger.error("Get dashboard failed", { userId, period, error });
      throw error;
    }
  }

  /**
   * Gera dados do dashboard (sem cache)
   */
  private async generateDashboard(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DashboardData> {
    try {
      // Buscar dados das contas
      const accounts = await accountService.getAccounts(
        userId,
        {},
        { limit: 100 },
      );
      const totalBalance = accounts.summary.totalBalance;

      // Buscar transações do período
      const transactions = await transactionService.getTransactions(
        userId,
        { startDate, endDate, status: "COMPLETED" },
        { limit: 1000 },
      );

      const { summary: transactionSummary } = transactions;

      // Buscar investimentos
      const portfolio = await investmentService.getPortfolioSummary(userId);

      // Buscar metas
      const goalsDashboard = await goalService.getGoalsDashboard(userId);

      // Calcular fluxo diário dos últimos 30 dias
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const dailyCashFlow =
        await transactionService.getTransactionSummaryByPeriod(
          userId,
          last30Days,
          new Date(),
          "day",
        );

      // Buscar transações recentes
      const recentTransactionsData = await transactionService.getTransactions(
        userId,
        { status: "COMPLETED" },
        { limit: 10, sortBy: "date", sortOrder: "desc" },
      );

      const recentTransactions = recentTransactionsData.transactions.map(
        (t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          category: t.category,
          date: t.date,
          accountName: t.account.name,
        }),
      );

      // Preparar dados dos gráficos
      const expensesByCategory = transactionSummary.byCategory
        .filter((cat) => cat.totalAmount > 0)
        .slice(0, 10)
        .map((cat) => ({
          category: cat.category,
          amount: cat.totalAmount,
          percentage: cat.percentage,
        }));

      const accountsBalance = accounts.accounts.map((acc) => ({
        accountName: acc.name,
        accountType: acc.type,
        balance: acc.balance,
        percentage: totalBalance > 0 ? (acc.balance / totalBalance) * 100 : 0,
      }));

      const investmentAllocation = portfolio.allocationByType.map((alloc) => ({
        type: alloc.type,
        value: alloc.currentValue,
        percentage: alloc.percentage,
      }));

      return {
        summary: {
          totalBalance,
          totalIncome: transactionSummary.totalIncome,
          totalExpense: transactionSummary.totalExpense,
          netIncome: transactionSummary.netAmount,
          totalInvested: portfolio.totalInvested,
          investmentValue: portfolio.currentValue,
          investmentGainLoss: portfolio.totalGainLoss,
          totalGoals: goalsDashboard.overview.totalGoals,
          completedGoals: goalsDashboard.overview.completedGoals,
          goalsProgress: goalsDashboard.overview.overallProgressPercentage,
        },
        charts: {
          expensesByCategory,
          dailyCashFlow,
          accountsBalance,
          investmentAllocation,
        },
        recentTransactions,
      };
    } catch (error) {
      logger.error("Generate dashboard failed", {
        userId,
        startDate,
        endDate,
        error,
      });
      throw error;
    }
  }

  /**
   * Gera relatório de fluxo de caixa com cache
   */
  async getCashFlowReport(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month" = "day",
  ): Promise<CashFlowReport> {
    try {
      const cacheKey = `cashflow-report:${userId}:${startDate.toISOString().split("T")[0]}:${endDate.toISOString().split("T")[0]}:${groupBy}`;

      return await cacheService.remember(
        cacheKey,
        async () =>
          this.generateCashFlowReport(userId, startDate, endDate, groupBy),
        {
          ttl: 600, // 10 minutos
          tags: [`user:${userId}`, "transactions", "reports"],
        },
      );
    } catch (error) {
      logger.error("Generate cash flow report failed", {
        userId,
        startDate,
        endDate,
        groupBy,
        error,
      });
      throw error;
    }
  }

  /**
   * Gera dados do relatório de fluxo de caixa (sem cache)
   */
  private async generateCashFlowReport(
    userId: string,
    startDate: Date,
    endDate: Date,
    groupBy: "day" | "week" | "month",
  ): Promise<CashFlowReport> {
    try {
      // Buscar transações do período
      const transactions = await transactionService.getTransactions(
        userId,
        { startDate, endDate, status: "COMPLETED" },
        { limit: 10000 },
      );

      const { summary } = transactions;

      // Calcular timeline
      const timeline = await transactionService.getTransactionSummaryByPeriod(
        userId,
        startDate,
        endDate,
        groupBy,
      );

      // Calcular médias diárias
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      );
      const averageDailyIncome =
        daysDiff > 0 ? summary.totalIncome / daysDiff : 0;
      const averageDailyExpense =
        daysDiff > 0 ? summary.totalExpense / daysDiff : 0;

      // Agrupar por categoria
      const byCategory = summary.byCategory.map((cat) => ({
        category: cat.category,
        income: 0, // Será calculado abaixo
        expense: cat.totalAmount,
        net: -cat.totalAmount,
        transactionCount: cat.count,
        percentage: cat.percentage,
      }));

      // Buscar contas para agrupamento
      const accounts = await accountService.getAccounts(
        userId,
        {},
        { limit: 100 },
      );
      const byAccount = accounts.accounts.map((acc) => ({
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.type,
        income: 0,
        expense: 0,
        transfer: 0,
        net: 0,
      }));

      // Calcular valores por conta (simplificado)
      for (const transaction of transactions.transactions) {
        const accountData = byAccount.find(
          (acc) => acc.accountId === transaction.account.id,
        );
        if (accountData) {
          if (transaction.type === "INCOME") {
            accountData.income += transaction.amount;
            accountData.net += transaction.amount;
          } else if (transaction.type === "EXPENSE") {
            accountData.expense += transaction.amount;
            accountData.net -= transaction.amount;
          } else if (transaction.type === "TRANSFER") {
            accountData.transfer += transaction.amount;
          }
        }
      }

      return {
        period: { startDate, endDate, groupBy },
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          totalTransfer: summary.totalTransfer,
          netCashFlow: summary.netAmount,
          averageDailyIncome: Math.round(averageDailyIncome * 100) / 100,
          averageDailyExpense: Math.round(averageDailyExpense * 100) / 100,
        },
        timeline,
        byCategory,
        byAccount: byAccount.filter(
          (acc) => acc.income > 0 || acc.expense > 0 || acc.transfer > 0,
        ),
      };
    } catch (error) {
      logger.error("Get cash flow report failed", {
        userId,
        startDate,
        endDate,
        groupBy,
        error,
      });
      throw error;
    }
  }

  /**
   * Gera relatório de despesas com cache
   */
  async getExpenseReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExpenseReport> {
    try {
      const cacheKey = `expense-report:${userId}:${startDate.toISOString().split("T")[0]}:${endDate.toISOString().split("T")[0]}`;

      return await cacheService.remember(
        cacheKey,
        async () => this.generateExpenseReport(userId, startDate, endDate),
        {
          ttl: 600, // 10 minutos
          tags: [`user:${userId}`, "transactions", "reports"],
        },
      );
    } catch (error) {
      logger.error("Generate expense report failed", {
        userId,
        startDate,
        endDate,
        error,
      });
      throw error;
    }
  }

  /**
   * Gera dados do relatório de despesas (sem cache)
   */
  private async generateExpenseReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ExpenseReport> {
    try {
      // Buscar despesas do período
      const expenses = await transactionService.getTransactions(
        userId,
        { type: "EXPENSE", startDate, endDate, status: "COMPLETED" },
        { limit: 10000 },
      );

      const { summary } = expenses;
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      );

      // Top despesas
      const topExpenses = expenses.transactions
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map((t) => ({
          id: t.id,
          description: t.description,
          category: t.category,
          amount: t.amount,
          date: t.date,
          accountName: t.account.name,
        }));

      // Agrupar por mês
      const byMonth = await transactionService.getTransactionSummaryByPeriod(
        userId,
        startDate,
        endDate,
        "month",
      );

      const monthlyExpenses = byMonth.map((month) => ({
        month: month.period,
        amount: month.expense,
        count: month.count,
        averageAmount: month.count > 0 ? month.expense / month.count : 0,
      }));

      // Calcular tendências (simplificado)
      const monthlyGrowth =
        monthlyExpenses.length >= 2
          ? ((monthlyExpenses[monthlyExpenses.length - 1].amount -
              monthlyExpenses[monthlyExpenses.length - 2].amount) /
              monthlyExpenses[monthlyExpenses.length - 2].amount) *
            100
          : 0;

      const categoryTrends = summary.byCategory.map((cat) => ({
        category: cat.category,
        trend: "stable" as "increasing" | "decreasing" | "stable",
        changePercentage: 0,
      }));

      return {
        period: { startDate, endDate },
        summary: {
          totalExpenses: summary.totalExpense,
          transactionCount: summary.totalTransactions,
          averageExpense:
            summary.totalTransactions > 0
              ? summary.totalExpense / summary.totalTransactions
              : 0,
          dailyAverage: daysDiff > 0 ? summary.totalExpense / daysDiff : 0,
        },
        byCategory: summary.byCategory.map((cat) => ({
          category: cat.category,
          amount: cat.totalAmount,
          count: cat.count,
          percentage: cat.percentage,
          averageAmount: cat.count > 0 ? cat.totalAmount / cat.count : 0,
        })),
        byMonth: monthlyExpenses,
        topExpenses,
        trends: {
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
          categoryTrends,
        },
      };
    } catch (error) {
      logger.error("Get expense report failed", {
        userId,
        startDate,
        endDate,
        error,
      });
      throw error;
    }
  }

  /**
   * Gera relatório de investimentos com cache
   */
  async getInvestmentReport(userId: string): Promise<InvestmentReport> {
    try {
      const cacheKey = `investment-report:${userId}`;

      return await cacheService.remember(
        cacheKey,
        async () => this.generateInvestmentReport(userId),
        {
          ttl: 900, // 15 minutos
          tags: [`user:${userId}`, "investments", "reports"],
        },
      );
    } catch (error) {
      logger.error("Generate investment report failed", { userId, error });
      throw error;
    }
  }

  /**
   * Gera dados do relatório de investimentos (sem cache)
   */
  private async generateInvestmentReport(
    userId: string,
  ): Promise<InvestmentReport> {
    try {
      // Buscar dados da carteira
      const portfolioData = await investmentService.getInvestments(
        userId,
        {},
        { limit: 1000 },
      );
      const { investments, portfolio } = portfolioData;

      // Buscar dividendos
      const dividendsData = await investmentService.getDividends(
        userId,
        {},
        { limit: 1000 },
      );
      const { dividends, summary: dividendSummary } = dividendsData;

      // Preparar dados dos investimentos
      const investmentsList = investments.map((inv) => ({
        id: inv.id,
        symbol: inv.symbol,
        name: inv.name,
        type: inv.type,
        sector: inv.sector,
        quantity: inv.quantity,
        averagePrice: inv.averagePrice,
        currentPrice: inv.currentPrice,
        totalInvested: inv.totalInvested,
        currentValue: inv.currentValue,
        gainLoss: inv.gainLoss,
        gainLossPercentage: inv.gainLossPercentage,
        totalDividends: inv.totalDividends,
        dividendYield: inv.dividendYield,
      }));

      // Top pagadores de dividendos
      const topDividendPayers = investmentsList
        .filter((inv) => inv.totalDividends > 0)
        .sort((a, b) => b.totalDividends - a.totalDividends)
        .slice(0, 10)
        .map((inv) => ({
          symbol: inv.symbol,
          name: inv.name,
          totalDividends: inv.totalDividends,
          dividendYield: inv.dividendYield,
        }));

      return {
        portfolio: {
          totalInvested: portfolio.totalInvested,
          currentValue: portfolio.currentValue,
          totalGainLoss: portfolio.totalGainLoss,
          totalGainLossPercentage: portfolio.totalGainLossPercentage,
          totalDividends: portfolio.totalDividends,
          totalDividendYield: portfolio.totalDividendYield,
          totalInvestments: portfolio.totalInvestments,
        },
        investments: investmentsList,
        allocation: {
          byType: portfolio.allocationByType,
          bySector: portfolio.allocationBySector,
        },
        performance: {
          topPerformers: portfolio.topPerformers,
          worstPerformers: portfolio.worstPerformers,
        },
        dividends: {
          totalReceived: dividendSummary.totalAmount,
          monthlyAverage:
            dividendSummary.byMonth.length > 0
              ? dividendSummary.totalAmount / dividendSummary.byMonth.length
              : 0,
          byMonth: dividendSummary.byMonth,
          topDividendPayers,
        },
      };
    } catch (error) {
      logger.error("Get investment report failed", { userId, error });
      throw error;
    }
  }

  /**
   * Gera relatório de metas com cache
   */
  async getGoalsReport(userId: string): Promise<GoalsReport> {
    try {
      const cacheKey = `goals-report:${userId}`;

      return await cacheService.remember(
        cacheKey,
        async () => this.generateGoalsReport(userId),
        {
          ttl: 600, // 10 minutos
          tags: [`user:${userId}`, "goals", "reports"],
        },
      );
    } catch (error) {
      logger.error("Get goals report failed", { userId, error });
      throw error;
    }
  }

  /**
   * Gera dados do relatório de metas (sem cache)
   */
  private async generateGoalsReport(userId: string): Promise<GoalsReport> {
    try {
      // Buscar dados das metas
      const goalsData = await goalService.getGoals(userId, {}, { limit: 1000 });
      const dashboard = await goalService.getGoalsDashboard(userId);

      // Calcular analytics
      const completedGoals = goalsData.goals.filter(
        (g) => g.status === "COMPLETED",
      );
      const totalGoals = goalsData.goals.length;

      const averageCompletionTime =
        completedGoals.length > 0
          ? completedGoals.reduce((sum, goal) => {
              const createdAt = new Date(goal.createdAt);
              const updatedAt = new Date(goal.updatedAt);
              return sum + (updatedAt.getTime() - createdAt.getTime());
            }, 0) /
            completedGoals.length /
            (1000 * 3600 * 24) // em dias
          : 0;

      const successRate =
        totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
      const averageGoalAmount =
        totalGoals > 0
          ? goalsData.goals.reduce((sum, g) => sum + g.targetAmount, 0) /
            totalGoals
          : 0;
      const totalSaved = goalsData.goals.reduce(
        (sum, g) => sum + g.currentAmount,
        0,
      );

      // Preparar dados das metas
      const goalsList = goalsData.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        description: goal.description,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate,
        category: goal.category,
        priority: goal.priority,
        status: goal.status,
        progressPercentage: goal.progressPercentage,
        remainingAmount: goal.remainingAmount,
        daysRemaining: goal.daysRemaining,
        dailyTargetAmount: goal.dailyTargetAmount,
        isOverdue: goal.isOverdue,
        progressVsExpected: goal.progressVsExpected,
      }));

      // Calcular médias por status
      const byStatus = dashboard.byStatus.map((status) => {
        const statusGoals = goalsList.filter((g) => g.status === status.status);
        const averageProgress =
          statusGoals.length > 0
            ? statusGoals.reduce((sum, g) => sum + g.progressPercentage, 0) /
              statusGoals.length
            : 0;

        return {
          status: status.status,
          count: status.count,
          totalTargetAmount: status.totalTargetAmount,
          totalCurrentAmount: status.totalCurrentAmount,
          averageProgress: Math.round(averageProgress * 100) / 100,
        };
      });

      // Calcular médias por categoria
      const byCategory = dashboard.byCategory.map((category) => {
        const categoryGoals = goalsList.filter(
          (g) => g.category === category.category,
        );
        const averageProgress =
          categoryGoals.length > 0
            ? categoryGoals.reduce((sum, g) => sum + g.progressPercentage, 0) /
              categoryGoals.length
            : 0;

        return {
          category: category.category,
          count: category.count,
          totalTargetAmount: category.totalTargetAmount,
          totalCurrentAmount: category.totalCurrentAmount,
          averageProgress: Math.round(averageProgress * 100) / 100,
        };
      });

      return {
        overview: {
          totalGoals: dashboard.overview.totalGoals,
          completedGoals: dashboard.overview.completedGoals,
          activeGoals: dashboard.overview.activeGoals,
          pausedGoals: dashboard.overview.pausedGoals,
          totalTargetAmount: dashboard.overview.totalTargetAmount,
          totalCurrentAmount: dashboard.overview.totalCurrentAmount,
          overallProgress: dashboard.overview.overallProgressPercentage,
        },
        goals: goalsList,
        analytics: {
          averageCompletionTime: Math.round(averageCompletionTime * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          averageGoalAmount: Math.round(averageGoalAmount * 100) / 100,
          totalSaved: Math.round(totalSaved * 100) / 100,
        },
        byStatus,
        byCategory,
        alerts: dashboard.alerts,
      };
    } catch (error) {
      logger.error("Generate goals report failed", { userId, error });
      throw error;
    }
  }

  /**
   * Invalida cache de relatórios para um usuário
   */
  async invalidateUserReports(userId: string): Promise<void> {
    try {
      await cacheService.invalidateByTags([`user:${userId}`]);
      logger.info("User reports cache invalidated", { userId });
    } catch (error) {
      logger.error("Failed to invalidate user reports cache", {
        userId,
        error,
      });
    }
  }

  /**
   * Invalida cache específico por tipo de relatório
   */
  async invalidateReportsByType(
    userId: string,
    type: "dashboard" | "transactions" | "investments" | "goals",
  ): Promise<void> {
    try {
      await cacheService.invalidateByTags([`user:${userId}`, type]);
      logger.info("Reports cache invalidated by type", { userId, type });
    } catch (error) {
      logger.error("Failed to invalidate reports cache by type", {
        userId,
        type,
        error,
      });
    }
  }

  /**
   * Invalida todos os caches de relatórios
   */
  async invalidateAllReports(): Promise<void> {
    try {
      await cacheService.invalidateByTags(["reports"]);
      logger.info("All reports cache invalidated");
    } catch (error) {
      logger.error("Failed to invalidate all reports cache", { error });
    }
  }

  /**
   * Obtém estatísticas do cache de relatórios
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}

export const reportService = new ReportService();
export default reportService;
