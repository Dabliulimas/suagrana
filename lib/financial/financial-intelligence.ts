"use client";

import React from "react";
import {
  type Transaction,
  type Account,
  type Goal,
  type Investment,
} from "../data-layer/types";
import { logComponents } from "../utils/logger";

export interface FinancialAlert {
  id: string;
  type: "warning" | "info" | "success" | "critical";
  category:
    | "budget"
    | "goal"
    | "investment"
    | "cash_flow"
    | "security"
    | "opportunity";
  title: string;
  message: string;
  actionable: boolean;
  action?: {
    label: string;
    href?: string;
    callback?: () => void;
  };
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  expiresAt?: string;
  dismissed?: boolean;
}

export interface FinancialInsight {
  id: string;
  type: "trend" | "pattern" | "prediction" | "recommendation";
  title: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number; // 0-100
  data: any;
  createdAt: string;
}

export interface SmartRecommendation {
  id: string;
  category: "savings" | "investment" | "budget" | "debt" | "goal";
  title: string;
  description: string;
  potentialSavings?: number;
  potentialGains?: number;
  difficulty: "easy" | "medium" | "hard";
  timeframe: "immediate" | "short_term" | "medium_term" | "long_term";
  steps: string[];
  createdAt: string;
}

class FinancialIntelligenceEngine {
  private alerts: FinancialAlert[] = [];
  private insights: FinancialInsight[] = [];
  private recommendations: SmartRecommendation[] = [];

  async analyzeFinancialHealth(): Promise<{
    alerts: FinancialAlert[];
    insights: FinancialInsight[];
    recommendations: SmartRecommendation[];
    healthScore: number;
  }> {
    // This method would need to receive data from the unified context
    // For now, using empty arrays as placeholders
    const transactions: Transaction[] = [];
    const accounts: Account[] = [];
    const goals: Goal[] = [];
    const investments: Investment[] = [];
    
    logComponents.info("Analyzing financial health with new data layer");

    // Reset arrays
    this.alerts = [];
    this.insights = [];
    this.recommendations = [];

    // Analyze different aspects
    await this.analyzeCashFlow(transactions);
    await this.analyzeBudgetPerformance(transactions);
    await this.analyzeGoalProgress(goals, transactions);
    await this.analyzeInvestmentPerformance(investments);
    await this.analyzeSpendingPatterns(transactions);
    await this.analyzeAccountHealth(accounts);
    await this.generateSmartRecommendations(
      transactions,
      accounts,
      goals,
      investments,
    );

    const healthScore = this.calculateHealthScore(
      transactions,
      accounts,
      goals,
      investments,
    );

    return {
      alerts: this.alerts,
      insights: this.insights,
      recommendations: this.recommendations,
      healthScore,
    };
  }

  private async analyzeCashFlow(transactions: Transaction[]): Promise<void> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const income = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === "expense" || t.type === "shared")
      .reduce((sum, t) => sum + t.amount, 0);

    const netFlow = income - expenses;
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0;

    // Cash flow alerts
    if (netFlow < 0) {
      this.alerts.push({
        id: `cashflow-negative-${Date.now()}`,
        type: "critical",
        category: "cash_flow",
        title: "Fluxo de Caixa Negativo",
        message: `Suas despesas estao R$ ${Math.abs(netFlow).toFixed(2)} acima da sua renda este mes.`,
        actionable: true,
        action: {
          label: "Ver Relatorio de Gastos",
          href: "/reports",
        },
        priority: "critical",
        createdAt: new Date().toISOString(),
      });
    }

    if (savingsRate < 10 && netFlow > 0) {
      this.alerts.push({
        id: `savings-low-${Date.now()}`,
        type: "warning",
        category: "budget",
        title: "Taxa de Poupanca Baixa",
        message: `Voce esta poupando apenas ${savingsRate.toFixed(1)}% da sua renda. Recomenda-se pelo menos 20%.`,
        actionable: true,
        action: {
          label: "Criar Orcamento",
          href: "/budget",
        },
        priority: "medium",
        createdAt: new Date().toISOString(),
      });
    }

    // Cash flow insights
    if (savingsRate > 30) {
      this.insights.push({
        id: `savings-excellent-${Date.now()}`,
        type: "trend",
        title: "Excelente Taxa de Poupança",
        description: `Você está poupando ${savingsRate.toFixed(1)}% da sua renda, muito acima da média recomendada.`,
        impact: "positive",
        confidence: 95,
        data: { savingsRate, netFlow, income },
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async analyzeBudgetPerformance(
    transactions: Transaction[],
  ): Promise<void> {
    // Analyze spending by category
    const categorySpending = transactions.reduce(
      (acc, t) => {
        if (t.type === "expense" || t.type === "shared") {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Find categories with unusual spending
    const avgSpending =
      Object.values(categorySpending).reduce((a, b) => a + b, 0) /
      Object.keys(categorySpending).length;

    Object.entries(categorySpending).forEach(([category, amount]) => {
      if (amount > avgSpending * 2) {
        this.alerts.push({
          id: `category-high-${category}-${Date.now()}`,
          type: "warning",
          category: "budget",
          title: `Gastos Elevados em ${category}`,
          message: `Voce gastou R$ ${amount.toFixed(2)} em ${category} este mes, acima do padrao usual.`,
          actionable: true,
          action: {
            label: "Ver Detalhes",
            href: `/transactions?category=${encodeURIComponent(category)}`,
          },
          priority: "medium",
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  private async analyzeGoalProgress(
    goals: Goal[],
    transactions: Transaction[],
  ): Promise<void> {
    goals.forEach((goal) => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      const timeLeft =
        new Date(goal.targetDate).getTime() - new Date().getTime();
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

      if (progress < 50 && daysLeft < 90) {
        this.alerts.push({
          id: `goal-behind-${goal.id}`,
          type: "warning",
          category: "goal",
          title: `Meta em Risco: ${goal.name}`,
          message: `Voce esta ${(100 - progress).toFixed(1)}% atras da sua meta com apenas ${daysLeft} dias restantes.`,
          actionable: true,
          action: {
            label: "Ajustar Meta",
            href: "/goals",
          },
          priority: "high",
          createdAt: new Date().toISOString(),
        });
      }

      if (progress > 90) {
        this.insights.push({
          id: `goal-near-completion-${goal.id}`,
          type: "trend",
          title: `Meta Quase Concluída: ${goal.name}`,
          description: `Você está a apenas ${(100 - progress).toFixed(1)}% de completar sua meta!`,
          impact: "positive",
          confidence: 100,
          data: { goalId: goal.id, progress },
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  private async analyzeInvestmentPerformance(
    investments: Investment[],
  ): Promise<void> {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investments.reduce(
      (sum, inv) => sum + (inv.currentValue || inv.amount),
      0,
    );
    const totalReturn = totalCurrentValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    if (returnPercentage < -10) {
      this.alerts.push({
        id: `investment-loss-${Date.now()}`,
        type: "warning",
        category: "investment",
        title: "Investimentos com Perdas Significativas",
        message: `Seus investimentos estão com ${Math.abs(returnPercentage).toFixed(1)}% de perda.`,
        actionable: true,
        action: {
          label: "Revisar Portfolio",
          href: "/investments",
        },
        priority: "high",
        createdAt: new Date().toISOString(),
      });
    }

    if (returnPercentage > 15) {
      this.insights.push({
        id: `investment-good-performance-${Date.now()}`,
        type: "trend",
        title: "Excelente Performance dos Investimentos",
        description: `Seus investimentos estão com ${returnPercentage.toFixed(1)}% de retorno positivo.`,
        impact: "positive",
        confidence: 90,
        data: { totalReturn, returnPercentage },
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async analyzeSpendingPatterns(
    transactions: Transaction[],
  ): Promise<void> {
    // Analyze spending by day of week
    const spendingByDay = transactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, t) => {
          const day = new Date(t.date).getDay();
          acc[day] = (acc[day] || 0) + t.amount;
          return acc;
        },
        {} as Record<number, number>,
      );

    const weekendSpending = (spendingByDay[0] || 0) + (spendingByDay[6] || 0);
    const weekdaySpending = Object.entries(spendingByDay)
      .filter(([day]) => parseInt(day) > 0 && parseInt(day) < 6)
      .reduce((sum, [, amount]) => sum + amount, 0);

    if (weekendSpending > weekdaySpending * 0.6) {
      this.insights.push({
        id: `weekend-spending-${Date.now()}`,
        type: "pattern",
        title: "Padrão de Gastos no Final de Semana",
        description:
          "Você tende a gastar mais nos finais de semana. Considere planejar atividades mais econômicas.",
        impact: "neutral",
        confidence: 80,
        data: { weekendSpending, weekdaySpending },
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async analyzeAccountHealth(accounts: Account[]): Promise<void> {
    accounts.forEach((account) => {
      if (account.type === "checking" && account.balance < 0) {
        this.alerts.push({
          id: `account-negative-${account.id}`,
          type: "critical",
          category: "security",
          title: `Conta ${account.name} no Vermelho`,
          message: `Sua conta ${account.name} está com saldo negativo de R$ ${Math.abs(account.balance).toFixed(2)}.`,
          actionable: true,
          action: {
            label: "Ver Conta",
            href: "/accounts",
          },
          priority: "critical",
          createdAt: new Date().toISOString(),
        });
      }

      if (account.type === "savings" && account.balance < 1000) {
        this.alerts.push({
          id: `emergency-low-${account.id}`,
          type: "warning",
          category: "security",
          title: "Reserva de Emergência Baixa",
          message:
            "Sua reserva de emergência está abaixo do recomendado. Considere aumentá-la.",
          actionable: true,
          action: {
            label: "Criar Meta de Reserva",
            href: "/goals",
          },
          priority: "high",
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  private async generateSmartRecommendations(
    transactions: Transaction[],
    accounts: Account[],
    goals: Goal[],
    investments: Investment[],
  ): Promise<void> {
    // Recommendation: Emergency fund
    const savingsAccounts = accounts.filter((a) => a.type === "savings");
    const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);

    if (totalSavings < monthlyExpenses * 3) {
      this.recommendations.push({
        id: `emergency-fund-${Date.now()}`,
        category: "savings",
        title: "Construir Reserva de Emergencia",
        description:
          "Crie uma reserva equivalente a 6 meses de gastos para maior seguranca financeira.",
        potentialSavings: monthlyExpenses * 6 - totalSavings,
        difficulty: "medium",
        timeframe: "medium_term",
        steps: [
          "Defina uma meta de reserva de emergência",
          "Configure transferencias automaticas mensais",
          "Mantenha o dinheiro em conta poupanca ou CDB",
          "Nao use a reserva exceto em emergencias reais",
        ],
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation: Investment diversification
    const investmentTypes = [...new Set(investments.map((i) => i.type))];
    if (investmentTypes.length < 3 && investments.length > 0) {
      this.recommendations.push({
        id: `diversify-investments-${Date.now()}`,
        category: "investment",
        title: "Diversificar Investimentos",
        description:
          "Diversifique sua carteira para reduzir riscos e aumentar potencial de retorno.",
        difficulty: "medium",
        timeframe: "short_term",
        steps: [
          "Analise sua carteira atual",
          "Estude diferentes tipos de investimento",
          "Considere fundos de investimento diversificados",
          "Rebalanceie periodicamente",
        ],
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation: Budget optimization
    const categorySpending = this.getCategorySpending(transactions);
    const highestCategory = Object.entries(categorySpending).sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (highestCategory && highestCategory[1] > monthlyExpenses * 0.3) {
      this.recommendations.push({
        id: `optimize-category-${Date.now()}`,
        category: "budget",
        title: `Otimizar Gastos em ${highestCategory[0]}`,
        description: `Você gasta muito em ${highestCategory[0]}. Pequenas reduções podem gerar grandes economias.`,
        potentialSavings: highestCategory[1] * 0.2, // 20% reduction
        difficulty: "easy",
        timeframe: "immediate",
        steps: [
          `Analise todos os gastos em ${highestCategory[0]}`,
          "Identifique gastos desnecessários ou excessivos",
          "Defina um limite mensal para esta categoria",
          "Use alertas para monitorar os gastos",
        ],
        createdAt: new Date().toISOString(),
      });
    }
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

    return recentExpenses / 3; // Average monthly expenses
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

  private calculateHealthScore(
    transactions: Transaction[],
    accounts: Account[],
    goals: Goal[],
    investments: Investment[],
  ): number {
    let score = 0;
    let maxScore = 0;

    // Cash flow health (25 points)
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0;

    if (savingsRate >= 20) score += 25;
    else if (savingsRate >= 10) score += 15;
    else if (savingsRate >= 0) score += 5;
    maxScore += 25;

    // Emergency fund (20 points)
    const totalSavings = accounts
      .filter((a) => a.type === "savings")
      .reduce((sum, a) => sum + a.balance, 0);
    const emergencyMonths =
      monthlyExpenses > 0 ? totalSavings / monthlyExpenses : 0;

    if (emergencyMonths >= 6) score += 20;
    else if (emergencyMonths >= 3) score += 15;
    else if (emergencyMonths >= 1) score += 10;
    else if (emergencyMonths > 0) score += 5;
    maxScore += 20;

    // Investment diversification (20 points)
    const investmentTypes = [...new Set(investments.map((i) => i.type))];
    const totalInvestments = investments.reduce((sum, i) => sum + i.amount, 0);

    if (totalInvestments > 0) {
      if (investmentTypes.length >= 4) score += 20;
      else if (investmentTypes.length >= 3) score += 15;
      else if (investmentTypes.length >= 2) score += 10;
      else score += 5;
    }
    maxScore += 20;

    // Goal progress (15 points)
    const activeGoals = goals.filter(
      (g) => new Date(g.targetDate) > new Date(),
    );
    if (activeGoals.length > 0) {
      const avgProgress =
        activeGoals.reduce(
          (sum, g) => sum + g.currentAmount / g.targetAmount,
          0,
        ) / activeGoals.length;
      score += Math.min(15, avgProgress * 15);
    }
    maxScore += 15;

    // Account health (10 points)
    const negativeAccounts = accounts.filter((a) => a.balance < 0).length;
    if (negativeAccounts === 0) score += 10;
    else if (negativeAccounts === 1) score += 5;
    maxScore += 10;

    // Debt management (10 points)
    const debtAccounts = accounts.filter(
      (a) => a.type === "credit" && a.balance < 0,
    );
    if (debtAccounts.length === 0) score += 10;
    else if (debtAccounts.length <= 2) score += 5;
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }

  private calculateMonthlyIncome(transactions: Transaction[]): number {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const recentIncome = transactions
      .filter((t) => t.type === "income" && new Date(t.date) >= threeMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    return recentIncome / 3; // Average monthly income
  }
}

export const financialIntelligence = new FinancialIntelligenceEngine();
export default financialIntelligence;
