/**
 * Sistema Inteligente de Notificações
 * Gera notificações baseadas em dados reais do usuário
 */

import type { Transaction, Account, Goal } from '../storage';

export interface SmartNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  category: 'budget' | 'goal' | 'bill' | 'investment' | 'general';
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isRead: boolean;
  data?: any; // Dados extras para a notificação
}

export class SmartNotificationEngine {
  static generateNotifications(
    transactions: Transaction[],
    accounts: Account[],
    goals: Goal[]
  ): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Análise de Orçamento Mensal
    const monthlyBudgetNotifications = this.analyzeBudgetAlerts(transactions, now);
    notifications.push(...monthlyBudgetNotifications);

    // 2. Alertas de Metas
    const goalAlerts = this.analyzeGoalAlerts(goals, transactions, now);
    notifications.push(...goalAlerts);

    // 3. Análise de Contas/Saldos
    const accountAlerts = this.analyzeAccountAlerts(accounts);
    notifications.push(...accountAlerts);

    // 4. Padrões de Gastos Suspeitos
    const spendingAlerts = this.analyzeSpendingPatterns(transactions, now);
    notifications.push(...spendingAlerts);

    // 5. Oportunidades de Economia
    const savingOpportunities = this.analyzeSavingOpportunities(transactions, now);
    notifications.push(...savingOpportunities);

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private static analyzeBudgetAlerts(transactions: Transaction[], now: Date): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Transações do mês atual
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // Orçamento estimado baseado na renda (80% da renda para gastos)
    const estimatedBudget = monthlyIncome * 0.80;

    if (monthlyExpenses > estimatedBudget && monthlyIncome > 0) {
      notifications.push({
        id: `budget-exceeded-${now.getTime()}`,
        type: 'warning',
        category: 'budget',
        title: '⚠️ Orçamento Excedido',
        message: `Você gastou R$ ${monthlyExpenses.toFixed(2)} este mês, ${((monthlyExpenses/estimatedBudget - 1) * 100).toFixed(1)}% acima do recomendado.`,
        actionLabel: 'Ver Orçamento',
        actionUrl: '/budget',
        priority: 'high',
        createdAt: now,
        isRead: false,
        data: { monthlyExpenses, estimatedBudget }
      });
    }

    // Análise por categoria
    const categorySpending = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    Object.entries(categorySpending).forEach(([category, amount]) => {
      const categoryBudget = this.getCategoryBudget(category, monthlyIncome);
      if (amount > categoryBudget) {
        notifications.push({
          id: `category-budget-${category}-${now.getTime()}`,
          type: 'info',
          category: 'budget',
          title: `💳 ${category} acima do esperado`,
          message: `Gastos em ${category}: R$ ${amount.toFixed(2)} (${((amount/categoryBudget - 1) * 100).toFixed(1)}% acima do recomendado)`,
          actionLabel: 'Analisar Categoria',
          actionUrl: '/transactions?category=' + encodeURIComponent(category),
          priority: 'medium',
          createdAt: now,
          isRead: false
        });
      }
    });

    return notifications;
  }

  private static analyzeGoalAlerts(goals: Goal[], transactions: Transaction[], now: Date): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    goals.forEach(goal => {
      const targetDate = new Date(goal.targetDate);
      const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const progress = goal.currentAmount / goal.targetAmount;
      const remainingAmount = goal.targetAmount - goal.currentAmount;

      // Meta próxima do vencimento
      if (daysUntilTarget <= 30 && daysUntilTarget > 0 && progress < 0.9) {
        notifications.push({
          id: `goal-deadline-${goal.id}`,
          type: 'warning',
          category: 'goal',
          title: `🎯 Meta próxima do vencimento`,
          message: `"${goal.name}" vence em ${daysUntilTarget} dias. Faltam R$ ${remainingAmount.toFixed(2)} (${(progress * 100).toFixed(1)}% concluída)`,
          actionLabel: 'Ver Meta',
          actionUrl: '/goals',
          priority: 'high',
          createdAt: now,
          isRead: false,
          data: { goalId: goal.id, daysUntilTarget, progress }
        });
      }

      // Meta alcançada
      if (progress >= 1) {
        notifications.push({
          id: `goal-achieved-${goal.id}`,
          type: 'success',
          category: 'goal',
          title: `🎉 Meta alcançada!`,
          message: `Parabéns! Você alcançou a meta "${goal.name}"`,
          actionLabel: 'Ver Metas',
          actionUrl: '/goals',
          priority: 'high',
          createdAt: now,
          isRead: false,
          data: { goalId: goal.id }
        });
      }

      // Meta com progresso lento
      if (daysUntilTarget > 0 && progress < 0.1 && daysUntilTarget <= 60) {
        const requiredMonthly = remainingAmount / (daysUntilTarget / 30);
        notifications.push({
          id: `goal-slow-progress-${goal.id}`,
          type: 'info',
          category: 'goal',
          title: `📈 Acelere sua meta`,
          message: `Para alcançar "${goal.name}", você precisa poupar R$ ${requiredMonthly.toFixed(2)}/mês`,
          actionLabel: 'Planejar',
          actionUrl: '/goals',
          priority: 'medium',
          createdAt: now,
          isRead: false
        });
      }
    });

    return notifications;
  }

  private static analyzeAccountAlerts(accounts: Account[]): SmartNotification[] {
    const notifications: SmartNotification[] = [];

    accounts.forEach(account => {
      // Saldo baixo
      if (account.balance < 500 && account.type === 'checking') {
        notifications.push({
          id: `low-balance-${account.id}`,
          type: 'warning',
          category: 'general',
          title: '💰 Saldo baixo',
          message: `Conta "${account.name}" está com saldo baixo: R$ ${account.balance.toFixed(2)}`,
          actionLabel: 'Ver Contas',
          actionUrl: '/accounts',
          priority: 'high',
          createdAt: new Date(),
          isRead: false
        });
      }

      // Saldo negativo
      if (account.balance < 0) {
        notifications.push({
          id: `negative-balance-${account.id}`,
          type: 'error',
          category: 'general',
          title: '🚨 Saldo negativo',
          message: `ATENÇÃO: Conta "${account.name}" está negativa em R$ ${Math.abs(account.balance).toFixed(2)}`,
          actionLabel: 'Ver Contas',
          actionUrl: '/accounts',
          priority: 'high',
          createdAt: new Date(),
          isRead: false
        });
      }
    });

    return notifications;
  }

  private static analyzeSpendingPatterns(transactions: Transaction[], now: Date): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const last7Days = transactions.filter(t => {
      const date = new Date(t.date);
      const daysAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7 && t.type === 'expense';
    });

    const last7DaysAmount = last7Days.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const averageDaily = last7DaysAmount / 7;

    // Gastos acima da média
    if (averageDaily > 200) {
      notifications.push({
        id: `high-spending-week-${now.getTime()}`,
        type: 'info',
        category: 'general',
        title: '📊 Gastos acima da média',
        message: `Seus gastos dos últimos 7 dias (R$ ${last7DaysAmount.toFixed(2)}) estão acima do normal`,
        actionLabel: 'Analisar',
        actionUrl: '/transactions',
        priority: 'medium',
        createdAt: now,
        isRead: false
      });
    }

    return notifications;
  }

  private static analyzeSavingOpportunities(transactions: Transaction[], now: Date): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Analisar padrões de gastos recorrentes
    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && t.type === 'expense';
    });

    const categoryTotals = monthlyTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    // Oportunidades de economia em categorias altas
    Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([category, amount], index) => {
        if (amount > 500) {
          const savingTips = this.getSavingTips(category);
          notifications.push({
            id: `saving-opportunity-${category}-${now.getTime()}`,
            type: 'info',
            category: 'general',
            title: `💡 Oportunidade de economia`,
            message: `${category} é sua ${index + 1}ª maior despesa (R$ ${amount.toFixed(2)}). ${savingTips}`,
            actionLabel: 'Ver Dicas',
            actionUrl: '/budget',
            priority: 'low',
            createdAt: now,
            isRead: false
          });
        }
      });

    return notifications;
  }

  private static getCategoryBudget(category: string, monthlyIncome: number): number {
    const budgetPercentages: Record<string, number> = {
      'Moradia': 0.30,
      'Alimentação': 0.15,
      'Transporte': 0.15,
      'Saúde': 0.10,
      'Educação': 0.05,
      'Entretenimento': 0.10,
      'Utilidades': 0.10,
      'Outros': 0.05
    };

    return monthlyIncome * (budgetPercentages[category] || 0.05);
  }

  private static getSavingTips(category: string): string {
    const tips: Record<string, string> = {
      'Alimentação': 'Considere fazer compras no atacado e cozinhar mais em casa.',
      'Transporte': 'Analise usar transporte público ou compartilhado.',
      'Entretenimento': 'Busque atividades gratuitas ou promoções.',
      'Utilidades': 'Revise seus planos e considere alternativas mais econômicas.',
      'Moradia': 'Reavalie se é possível renegociar o aluguel ou financiamento.',
      'Saúde': 'Compare preços de medicamentos e consulte planos de saúde.',
      'Educação': 'Procure cursos online gratuitos ou com desconto.',
      'Outros': 'Analise se todos os gastos são realmente necessários.'
    };

    return tips[category] || 'Revise se todos os gastos desta categoria são necessários.';
  }
}

// Hooks para integração com React
import React from 'react';

export const useSmartNotifications = () => {
  const [notifications, setNotifications] = React.useState<SmartNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Carregar dados do localStorage
        const transactionsData = localStorage.getItem('transactions') || localStorage.getItem('sua-grana-transactions');
        const accountsData = localStorage.getItem('accounts') || localStorage.getItem('sua-grana-accounts');
        const goalsData = localStorage.getItem('goals') || localStorage.getItem('sua-grana-goals');

        const transactions = transactionsData ? JSON.parse(transactionsData) : [];
        const accounts = accountsData ? JSON.parse(accountsData) : [];
        const goals = goalsData ? JSON.parse(goalsData) : [];

        const generatedNotifications = SmartNotificationEngine.generateNotifications(
          transactions,
          accounts,
          goals
        );

        // Carregar notificações lidas do localStorage
        const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const notificationsWithReadStatus = generatedNotifications.map(notification => ({
          ...notification,
          isRead: readNotifications.includes(notification.id)
        }));

        setNotifications(notificationsWithReadStatus);
      } catch (error) {
        console.error('Error loading smart notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Recarregar a cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (notificationId: string) => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(notificationId)) {
      readNotifications.push(notificationId);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }

    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications.filter(n => !n.isRead).length
  };
};
