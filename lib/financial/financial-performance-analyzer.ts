"use client";

import React from "react";
import {
  type Transaction,
  type Account,
  type Goal,
  type Investment,
} from "../data-layer/types";
import { logComponents } from "../utils/logger";

export interface PerformanceMetrics {
  cashFlowHealth: {
    score: number;
    trend: "improving" | "stable" | "declining";
    monthlyFlow: number;
    savingsRate: number;
    recommendation: string;
  };
  budgetEfficiency: {
    score: number;
    adherence: number; // percentage
    topCategories: Array<{
      category: string;
      spent: number;
      budget: number;
      variance: number;
    }>;
    recommendation: string;
  };
  goalProgress: {
    score: number;
    onTrackGoals: number;
    totalGoals: number;
    averageProgress: number;
    recommendation: string;
  };
  investmentPerformance: {
    score: number;
    totalReturn: number;
    returnPercentage: number;
    diversificationScore: number;
    recommendation: string;
  };
  financialStability: {
    score: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
    creditUtilization: number;
    recommendation: string;
  };
  overallScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
}

export interface TrendAnalysis {
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  income: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
    trend: "up" | "down" | "stable";
  };
  expenses: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
    trend: "up" | "down" | "stable";
  };
  savings: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
    trend: "up" | "down" | "stable";
  };
  netWorth: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
    trend: "up" | "down" | "stable";
  };
}

export interface CategoryAnalysis {
  category: string;
  currentMonth: number;
  previousMonth: number;
  average3Months: number;
  trend: "increasing" | "decreasing" | "stable";
  variance: number;
  percentageOfTotal: number;
  recommendation?: string;
}

export interface PredictiveInsights {
  nextMonthExpenses: {
    predicted: number;
    confidence: number;
    factors: string[];
  };
  goalCompletionDates: Array<{
    goalId: string;
    goalName: string;
    predictedDate: string;
    confidence: number;
    currentProgress: number;
  }>;
  budgetRisks: Array<{
    category: string;
    riskLevel: "low" | "medium" | "high";
    description: string;
    suggestedAction: string;
  }>;
  savingsProjection: {
    nextMonth: number;
    next3Months: number;
    next6Months: number;
    confidence: number;
  };
}

export class FinancialPerformanceAnalyzer {
  async analyzePerformance(): Promise<PerformanceMetrics> {
    // This method would need to receive data from the unified context
    // For now, using empty arrays as placeholders
    const transactions: Transaction[] = [];
    const accounts: Account[] = [];
    const goals: Goal[] = [];
    const investments: Investment[] = [];
    
    logComponents.info("Analyzing performance with new data layer");

    const cashFlowHealth = this.analyzeCashFlowHealth(transactions);
    const budgetEfficiency = this.analyzeBudgetEfficiency(transactions);
    const goalProgress = this.analyzeGoalProgress(goals);
    const investmentPerformance =
      this.analyzeInvestmentPerformance(investments);
    const financialStability = this.analyzeFinancialStability(
      transactions,
      accounts,
    );

    const overallScore = this.calculateOverallScore({
      cashFlowHealth,
      budgetEfficiency,
      goalProgress,
      investmentPerformance,
      financialStability,
    });

    const riskLevel = this.determineRiskLevel(overallScore);
    const recommendations = this.generateRecommendations({
      cashFlowHealth,
      budgetEfficiency,
      goalProgress,
      investmentPerformance,
      financialStability,
    });

    return {
      cashFlowHealth,
      budgetEfficiency,
      goalProgress,
      investmentPerformance,
      financialStability,
      overallScore,
      riskLevel,
      recommendations,
    };
  }

  async analyzeTrends(
    period: "weekly" | "monthly" | "quarterly" | "yearly" = "monthly",
  ): Promise<TrendAnalysis> {
    // This method would need to receive data from the unified context
    const transactions: Transaction[] = [];
    const accounts: Account[] = [];
    const investments: Investment[] = [];
    
    logComponents.info("Analyzing trends with new data layer");

    const { currentPeriod, previousPeriod } = this.getPeriodRanges(period);

    const currentTransactions = transactions.filter(
      (t) =>
        new Date(t.date) >= currentPeriod.start &&
        new Date(t.date) <= currentPeriod.end,
    );
    const previousTransactions = transactions.filter(
      (t) =>
        new Date(t.date) >= previousPeriod.start &&
        new Date(t.date) <= previousPeriod.end,
    );

    const currentIncome = this.calculateIncome(currentTransactions);
    const previousIncome = this.calculateIncome(previousTransactions);
    const currentExpenses = this.calculateExpenses(currentTransactions);
    const previousExpenses = this.calculateExpenses(previousTransactions);
    const currentSavings = currentIncome - currentExpenses;
    const previousSavings = previousIncome - previousExpenses;

    const currentNetWorth = this.calculateNetWorth(accounts, investments);
    const previousNetWorth = this.estimatePreviousNetWorth(
      currentNetWorth,
      currentSavings,
      previousSavings,
    );

    return {
      period,
      income: this.calculateTrendMetrics(currentIncome, previousIncome),
      expenses: this.calculateTrendMetrics(currentExpenses, previousExpenses),
      savings: this.calculateTrendMetrics(currentSavings, previousSavings),
      netWorth: this.calculateTrendMetrics(currentNetWorth, previousNetWorth),
    };
  }

  async analyzeCategoryTrends(): Promise<CategoryAnalysis[]> {
    const transactions = await transactions;
    const now = new Date();

    const currentMonth = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const previousMonth = transactions.filter((t) => {
      const date = new Date(t.date);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return (
        date.getMonth() === prevMonth.getMonth() &&
        date.getFullYear() === prevMonth.getFullYear()
      );
    });

    const last3Months = transactions.filter((t) => {
      const date = new Date(t.date);
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
      return date >= threeMonthsAgo;
    });

    const categories = [...new Set(transactions.map((t) => t.category))];

    return categories
      .map((category) => {
        const currentSpent = currentMonth
          .filter(
            (t) =>
              t.category === category &&
              (t.type === "expense" || t.type === "shared"),
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const previousSpent = previousMonth
          .filter(
            (t) =>
              t.category === category &&
              (t.type === "expense" || t.type === "shared"),
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const average3Months =
          last3Months
            .filter(
              (t) =>
                t.category === category &&
                (t.type === "expense" || t.type === "shared"),
            )
            .reduce((sum, t) => sum + t.amount, 0) / 3;

        const totalCurrentExpenses = currentMonth
          .filter((t) => t.type === "expense" || t.type === "shared")
          .reduce((sum, t) => sum + t.amount, 0);

        const variance = currentSpent - average3Months;
        const percentageOfTotal =
          totalCurrentExpenses > 0
            ? (currentSpent / totalCurrentExpenses) * 100
            : 0;

        let trend: "increasing" | "decreasing" | "stable";
        if (Math.abs(variance) < average3Months * 0.1) {
          trend = "stable";
        } else if (variance > 0) {
          trend = "increasing";
        } else {
          trend = "decreasing";
        }

        return {
          category,
          currentMonth: currentSpent,
          previousMonth: previousSpent,
          average3Months,
          trend,
          variance,
          percentageOfTotal,
          recommendation: this.getCategoryRecommendation(
            category,
            trend,
            variance,
            percentageOfTotal,
          ),
        };
      })
      .filter(
        (analysis) => analysis.currentMonth > 0 || analysis.previousMonth > 0,
      );
  }

  async generatePredictiveInsights(): Promise<PredictiveInsights> {
    const transactions = await transactions;
    const goals = await goals;

    const nextMonthExpenses = this.predictNextMonthExpenses(transactions);
    const goalCompletionDates = this.predictGoalCompletions(
      goals,
      transactions,
    );
    const budgetRisks = this.identifyBudgetRisks(transactions);
    const savingsProjection = this.projectSavings(transactions);

    return {
      nextMonthExpenses,
      goalCompletionDates,
      budgetRisks,
      savingsProjection,
    };
  }

  private analyzeCashFlowHealth(transactions: Transaction[]) {
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlyFlow = monthlyIncome - monthlyExpenses;
    const savingsRate =
      monthlyIncome > 0 ? (monthlyFlow / monthlyIncome) * 100 : 0;

    let score = 0;
    if (savingsRate >= 20) score = 100;
    else if (savingsRate >= 15) score = 85;
    else if (savingsRate >= 10) score = 70;
    else if (savingsRate >= 5) score = 50;
    else if (savingsRate >= 0) score = 30;
    else score = 0;

    const trend = this.calculateCashFlowTrend(transactions);
    const recommendation = this.getCashFlowRecommendation(
      savingsRate,
      monthlyFlow,
    );

    return {
      score,
      trend,
      monthlyFlow,
      savingsRate,
      recommendation,
    };
  }

  private analyzeBudgetEfficiency(transactions: Transaction[]) {
    // This would integrate with a budget system if available
    // For now, we'll analyze spending patterns
    const categorySpending = this.getCategorySpending(transactions);
    const totalSpending = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    // Simulate budget adherence based on spending patterns
    const adherence = Math.max(0, 100 - (totalSpending > 5000 ? 20 : 0));
    const score = adherence;

    const topCategories = Object.entries(categorySpending)
      .map(([category, spent]) => ({
        category,
        spent,
        budget: spent * 1.2, // Simulated budget
        variance: spent * 0.2,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    return {
      score,
      adherence,
      topCategories,
      recommendation: this.getBudgetRecommendation(adherence, topCategories),
    };
  }

  private analyzeGoalProgress(goals: Goal[]) {
    if (goals.length === 0) {
      return {
        score: 50,
        onTrackGoals: 0,
        totalGoals: 0,
        averageProgress: 0,
        recommendation:
          "Considere criar metas financeiras para melhor organizacao.",
      };
    }

    const activeGoals = goals.filter(
      (g) => new Date(g.targetDate) > new Date(),
    );
    const onTrackGoals = activeGoals.filter((g) => {
      const progress = (g.currentAmount / g.targetAmount) * 100;
      const timeLeft = new Date(g.targetDate).getTime() - new Date().getTime();
      const daysLeft = timeLeft / (1000 * 60 * 60 * 24);
      const expectedProgress = Math.max(0, 100 - (daysLeft / 365) * 100);
      return progress >= expectedProgress * 0.8;
    }).length;

    const averageProgress =
      activeGoals.reduce(
        (sum, g) => sum + (g.currentAmount / g.targetAmount) * 100,
        0,
      ) / activeGoals.length;

    const score = (onTrackGoals / activeGoals.length) * 100;

    return {
      score,
      onTrackGoals,
      totalGoals: activeGoals.length,
      averageProgress,
      recommendation: this.getGoalRecommendation(score, averageProgress),
    };
  }

  private analyzeInvestmentPerformance(investments: Investment[]) {
    if (investments.length === 0) {
      return {
        score: 30,
        totalReturn: 0,
        returnPercentage: 0,
        diversificationScore: 0,
        recommendation:
          "Considere comecar a investir para fazer seu dinheiro crescer.",
      };
    }

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investments.reduce(
      (sum, inv) => sum + (inv.currentValue || inv.amount),
      0,
    );
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    const investmentTypes = [...new Set(investments.map((i) => i.type))];
    const diversificationScore = Math.min(
      100,
      (investmentTypes.length / 5) * 100,
    );

    let score = 0;
    if (returnPercentage >= 15) score = 100;
    else if (returnPercentage >= 10) score = 85;
    else if (returnPercentage >= 5) score = 70;
    else if (returnPercentage >= 0) score = 50;
    else if (returnPercentage >= -10) score = 30;
    else score = 0;

    // Adjust score based on diversification
    score = (score + diversificationScore) / 2;

    return {
      score,
      totalReturn,
      returnPercentage,
      diversificationScore,
      recommendation: this.getInvestmentRecommendation(
        returnPercentage,
        diversificationScore,
      ),
    };
  }

  private analyzeFinancialStability(
    transactions: Transaction[],
    accounts: Account[],
  ) {
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const savingsBalance = accounts
      .filter((a) => a.type === "savings")
      .reduce((sum, a) => sum + a.balance, 0);

    const emergencyFundMonths =
      monthlyExpenses > 0 ? savingsBalance / monthlyExpenses : 0;

    // Simulate debt and credit metrics
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const debtAccounts = accounts.filter(
      (a) => a.type === "credit" && a.balance < 0,
    );
    const totalDebt = Math.abs(
      debtAccounts.reduce((sum, a) => sum + Math.min(0, a.balance), 0),
    );
    const debtToIncomeRatio =
      monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : 0;

    const creditUtilization = 30; // Simulated

    let score = 0;
    if (emergencyFundMonths >= 6) score += 40;
    else if (emergencyFundMonths >= 3) score += 25;
    else if (emergencyFundMonths >= 1) score += 15;

    if (debtToIncomeRatio <= 20) score += 30;
    else if (debtToIncomeRatio <= 40) score += 20;
    else if (debtToIncomeRatio <= 60) score += 10;

    if (creditUtilization <= 30) score += 30;
    else if (creditUtilization <= 50) score += 20;
    else if (creditUtilization <= 70) score += 10;

    return {
      score,
      emergencyFundMonths,
      debtToIncomeRatio,
      creditUtilization,
      recommendation: this.getStabilityRecommendation(
        emergencyFundMonths,
        debtToIncomeRatio,
      ),
    };
  }

  private calculateOverallScore(metrics: any): number {
    const weights = {
      cashFlowHealth: 0.25,
      budgetEfficiency: 0.2,
      goalProgress: 0.15,
      investmentPerformance: 0.2,
      financialStability: 0.2,
    };

    return Math.round(
      metrics.cashFlowHealth.score * weights.cashFlowHealth +
        metrics.budgetEfficiency.score * weights.budgetEfficiency +
        metrics.goalProgress.score * weights.goalProgress +
        metrics.investmentPerformance.score * weights.investmentPerformance +
        metrics.financialStability.score * weights.financialStability,
    );
  }

  private determineRiskLevel(
    score: number,
  ): "low" | "medium" | "high" | "critical" {
    if (score >= 80) return "low";
    if (score >= 60) return "medium";
    if (score >= 40) return "high";
    return "critical";
  }

  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    if (metrics.cashFlowHealth.score < 70) {
      recommendations.push(metrics.cashFlowHealth.recommendation);
    }

    if (metrics.budgetEfficiency.score < 70) {
      recommendations.push(metrics.budgetEfficiency.recommendation);
    }

    if (metrics.goalProgress.score < 70) {
      recommendations.push(metrics.goalProgress.recommendation);
    }

    if (metrics.investmentPerformance.score < 70) {
      recommendations.push(metrics.investmentPerformance.recommendation);
    }

    if (metrics.financialStability.score < 70) {
      recommendations.push(metrics.financialStability.recommendation);
    }

    return recommendations;
  }

  // Helper methods
  private calculateMonthlyIncome(transactions: Transaction[]): number {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const recentIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.date) >= threeMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    return recentIncome / 3;
  }

  private calculateMonthlyExpenses(transactions: Transaction[]): number {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const recentExpenses = transactions
      .filter(
        (t) =>
          (t.type === "expense" || t.type === "shared") &&
          new Date(t.date) >= threeMonthsAgo,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return recentExpenses / 3;
  }

  private calculateIncome(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateExpenses(transactions: Transaction[]): number {
    return transactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateNetWorth(
    accounts: Account[],
    investments: Investment[],
  ): number {
    const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
    const investmentsTotal = investments.reduce(
      (sum, i) => sum + (i.currentValue || i.amount),
      0,
    );
    return accountsTotal + investmentsTotal;
  }

  private getCategorySpending(
    transactions: Transaction[],
  ): Record<string, number> {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter(
        (t) =>
          (t.type === "expense" || t.type === "shared") &&
          new Date(t.date) >= currentMonth,
      )
      .reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        },
        {} as Record<string, number>,
      );
  }

  // Recommendation methods
  private getCashFlowRecommendation(
    savingsRate: number,
    monthlyFlow: number,
  ): string {
    if (monthlyFlow < 0) {
      return "Suas despesas excedem sua renda. Revise seu orcamento e corte gastos desnecessarios.";
    }
    if (savingsRate < 10) {
      return "Tente aumentar sua taxa de poupanca para pelo menos 20% da renda.";
    }
    if (savingsRate < 20) {
      return "Boa taxa de poupanca! Considere aumentar para 20% ou mais.";
    }
    return "Excelente controle de fluxo de caixa! Continue assim.";
  }

  private getBudgetRecommendation(
    adherence: number,
    topCategories: any[],
  ): string {
    if (adherence < 70) {
      const highestCategory = topCategories[0]?.category || "gastos";
      return `Revise seus gastos em ${highestCategory} para melhorar o controle orcamentario.`;
    }
    return "Bom controle orcamentario. Continue monitorando seus gastos.";
  }

  private getGoalRecommendation(
    score: number,
    averageProgress: number,
  ): string {
    if (score < 50) {
      return "Muitas metas estao atrasadas. Considere revisar os valores ou prazos.";
    }
    if (averageProgress < 30) {
      return "Aumente suas contribuicoes mensais para as metas.";
    }
    return "Bom progresso nas metas! Continue focado nos objetivos.";
  }

  private getInvestmentRecommendation(
    returnPercentage: number,
    diversificationScore: number,
  ): string {
    if (returnPercentage < 0) {
      return "Seus investimentos estao com perdas. Considere revisar sua estrategia.";
    }
    if (diversificationScore < 50) {
      return "Diversifique mais seus investimentos para reduzir riscos.";
    }
    if (returnPercentage < 5) {
      return "Considere investimentos com maior potencial de retorno.";
    }
    return "Boa performance dos investimentos! Continue diversificando.";
  }

  private getStabilityRecommendation(
    emergencyMonths: number,
    debtRatio: number,
  ): string {
    if (emergencyMonths < 3) {
      return "Construa uma reserva de emergencia de pelo menos 6 meses de gastos.";
    }
    if (debtRatio > 40) {
      return "Foque em reduzir suas dividas para melhorar a estabilidade financeira.";
    }
    return "Boa estabilidade financeira! Mantenha a reserva de emergencia.";
  }

  private getCategoryRecommendation(
    category: string,
    trend: string,
    variance: number,
    percentage: number,
  ): string | undefined {
    if (trend === "increasing" && percentage > 30) {
      return `Gastos em ${category} estao altos (${percentage.toFixed(1)}% do total). Considere reduzir.`;
    }
    if (trend === "increasing" && variance > 500) {
      return `Aumento significativo em ${category}. Monitore estes gastos.`;
    }
    return undefined;
  }

  // Additional helper methods for trend analysis
  private getPeriodRanges(period: string) {
    const now = new Date();
    let currentStart: Date,
      currentEnd: Date,
      previousStart: Date,
      previousEnd: Date;

    switch (period) {
      case "weekly":
        currentStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7,
        );
        currentEnd = now;
        previousStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 14,
        );
        previousEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 7,
        );
        break;
      case "monthly":
        currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentEnd = now;
        previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "quarterly":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        currentEnd = now;
        previousStart = new Date(
          now.getFullYear(),
          (currentQuarter - 1) * 3,
          1,
        );
        previousEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
        break;
      case "yearly":
        currentStart = new Date(now.getFullYear(), 0, 1);
        currentEnd = now;
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        throw new Error("Invalid period");
    }

    return {
      currentPeriod: { start: currentStart, end: currentEnd },
      previousPeriod: { start: previousStart, end: previousEnd },
    };
  }

  private calculateTrendMetrics(current: number, previous: number) {
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    let trend: "up" | "down" | "stable";
    if (Math.abs(changePercentage) < 5) {
      trend = "stable";
    } else if (change > 0) {
      trend = "up";
    } else {
      trend = "down";
    }

    return {
      current,
      previous,
      change,
      changePercentage,
      trend,
    };
  }

  private calculateCashFlowTrend(
    transactions: Transaction[],
  ): "improving" | "stable" | "declining" {
    // Simplified trend calculation
    const now = new Date();
    const currentMonth = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const previousMonth = transactions.filter((t) => {
      const date = new Date(t.date);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      return (
        date.getMonth() === prevMonth.getMonth() &&
        date.getFullYear() === prevMonth.getFullYear()
      );
    });

    const currentFlow =
      this.calculateIncome(currentMonth) - this.calculateExpenses(currentMonth);
    const previousFlow =
      this.calculateIncome(previousMonth) -
      this.calculateExpenses(previousMonth);

    if (currentFlow > previousFlow * 1.05) return "improving";
    if (currentFlow < previousFlow * 0.95) return "declining";
    return "stable";
  }

  private estimatePreviousNetWorth(
    current: number,
    currentSavings: number,
    previousSavings: number,
  ): number {
    // Simple estimation based on savings difference
    return current - (currentSavings - previousSavings);
  }

  private predictNextMonthExpenses(transactions: Transaction[]) {
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const seasonalFactor = this.getSeasonalFactor();
    const predicted = monthlyExpenses * seasonalFactor;

    return {
      predicted,
      confidence: 75,
      factors: [
        "Media dos ultimos 3 meses",
        "Ajuste sazonal",
        "Padroes de gastos",
      ],
    };
  }

  private predictGoalCompletions(goals: Goal[], transactions: Transaction[]) {
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlySavings = monthlyIncome - monthlyExpenses;

    return goals
      .filter((g) => new Date(g.targetDate) > new Date())
      .map((goal) => {
        const remaining = goal.targetAmount - goal.currentAmount;
        const monthsNeeded =
          monthlySavings > 0
            ? Math.ceil(remaining / (monthlySavings * 0.3))
            : Infinity;
        const predictedDate = new Date();
        predictedDate.setMonth(predictedDate.getMonth() + monthsNeeded);

        return {
          goalId: goal.id,
          goalName: goal.name,
          predictedDate: predictedDate.toISOString(),
          confidence: monthsNeeded < 24 ? 80 : 50,
          currentProgress: (goal.currentAmount / goal.targetAmount) * 100,
        };
      });
  }

  private identifyBudgetRisks(transactions: Transaction[]) {
    const categorySpending = this.getCategorySpending(transactions);
    const totalSpending = Object.values(categorySpending).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    return Object.entries(categorySpending)
      .filter(([, amount]) => amount > totalSpending * 0.25)
      .map(([category, amount]) => ({
        category,
        riskLevel: "high" as const,
        description: `Gastos em ${category} representam ${((amount / totalSpending) * 100).toFixed(1)}% do total`,
        suggestedAction: `Defina um limite mensal para ${category}`,
      }));
  }

  private projectSavings(transactions: Transaction[]) {
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlySavings = monthlyIncome - monthlyExpenses;

    return {
      nextMonth: monthlySavings,
      next3Months: monthlySavings * 3,
      next6Months: monthlySavings * 6,
      confidence: 70,
    };
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth();
    // December and January typically have higher expenses
    if (month === 11 || month === 0) return 1.2;
    // June and July (vacation season in Brazil)
    if (month === 5 || month === 6) return 1.1;
    return 1.0;
  }
}

export const performanceAnalyzer = new FinancialPerformanceAnalyzer();
export default performanceAnalyzer;
