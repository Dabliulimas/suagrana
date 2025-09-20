"use client";

import { logComponents } from "../lib/logger";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  category?: "transaction" | "goal" | "investment" | "system" | "reminder";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isNotificationPanelOpen: boolean;

  // Actions
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isNotificationPanelOpen: false,

  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  toggleNotificationPanel: () => {},
  closeNotificationPanel: () => {},
  refreshNotifications: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem("suagrana-notifications");
    let loadedNotifications: Notification[] = [];
    
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        loadedNotifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(loadedNotifications);
      } catch (error) {
        logComponents.error("Error loading notifications:", error);
      }
    }

    // Generate real notifications based on actual data (after loading existing ones)
    generateRealNotifications(loadedNotifications);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      "suagrana-notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  const generateRealNotifications = (existingNotifications: Notification[] = []) => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Load real data from localStorage
      const transactions = JSON.parse(localStorage.getItem('sua-grana-transactions') || localStorage.getItem('transactions') || '[]');
      const accounts = JSON.parse(localStorage.getItem('sua-grana-accounts') || localStorage.getItem('accounts') || '[]');
      const goals = JSON.parse(localStorage.getItem('sua-grana-goals') || localStorage.getItem('goals') || '[]');
      const trips = JSON.parse(localStorage.getItem('sua-grana-trips') || localStorage.getItem('trips') || '[]');
      const reminders = JSON.parse(localStorage.getItem('reminders') || '[]');
      const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');

      // Filter out test data that might contaminate notifications
      const realGoals = goals.filter((g: any) => 
        !g.name?.includes('Teste') && 
        !g.name?.includes('Test') && 
        !g.name?.includes('teste') &&
        !g.name?.includes('Meta Teste')
      );
      
      const realTransactions = transactions.filter((t: any) => 
        !t.description?.includes('Teste') && 
        !t.description?.includes('Test') && 
        !t.description?.includes('teste')
      );
      
      const realAccounts = accounts.filter((a: any) => 
        !a.name?.includes('Teste') && 
        !a.name?.includes('Test') && 
        !a.name?.includes('teste')
      );
      
      const realTrips = trips.filter((t: any) => 
        !t.name?.includes('Teste') && 
        !t.name?.includes('Test') && 
        !t.name?.includes('teste')
      );

      const realReminders = reminders.filter((r: any) => 
        !r.title?.includes('Teste') && 
        !r.title?.includes('Test') && 
        !r.title?.includes('teste')
      );
      
      const realSubscriptions = subscriptions.filter((s: any) => 
        !s.name?.includes('Teste') && 
        !s.name?.includes('Test') && 
        !s.name?.includes('teste')
      );

      // If no real data exists, don't generate any notifications
      if (realTransactions.length === 0 && realAccounts.length === 0 && realGoals.length === 0 && realTrips.length === 0 && realReminders.length === 0 && realSubscriptions.length === 0) {
        return;
      }

      const realNotifications: Omit<Notification, "id" | "timestamp" | "isRead">[] = [];

      // 1. Check for high monthly expenses
      const currentMonthTransactions = realTransactions.filter((t: any) => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      });

      const monthlyExpenses = currentMonthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

      if (monthlyExpenses > 2000) {
        realNotifications.push({
          title: 'Gastos elevados este mês',
          message: `Você já gastou R$ ${monthlyExpenses.toFixed(2)} este mês`,
          type: 'warning',
          category: 'transaction'
        });
      }

      // 2. Check for low balance
      const totalBalance = realAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
      if (totalBalance < 500 && realAccounts.length > 0) {
        realNotifications.push({
          title: 'Saldo baixo',
          message: `Seu saldo total está em R$ ${totalBalance.toFixed(2)}`,
          type: 'warning',
          category: 'system'
        });
      }

      // 3. Check for goals near deadline
      realGoals.forEach((goal: any) => {
        if (goal.targetDate || goal.deadline) {
          const targetDate = new Date(goal.targetDate || goal.deadline);
          const daysUntilTarget = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilTarget <= 30 && daysUntilTarget > 0) {
            const current = goal.currentAmount || goal.current || 0;
            const target = goal.targetAmount || goal.target || 1;
            const progress = (current / target) * 100;
            
            realNotifications.push({
              title: 'Meta próxima do prazo',
              message: `"${goal.name || goal.title}" vence em ${daysUntilTarget} dias (${progress.toFixed(1)}% concluída)`,
              type: 'info',
              category: 'goal'
            });
          }
        }
      });

      // 4. Check for completed goals
      realGoals.forEach((goal: any) => {
        const current = goal.currentAmount || goal.current || 0;
        const target = goal.targetAmount || goal.target || 1;
        
        if (current >= target && !goal.isCompleted) {
          realNotifications.push({
            title: 'Meta atingida! 🎉',
            message: `Parabéns! Você atingiu sua meta "${goal.name || goal.title}"`,
            type: 'success',
            category: 'goal'
          });
        }
      });

      // 5. Check for upcoming trips
      realTrips.forEach((trip: any) => {
        if (trip.startDate && trip.status === 'planned') {
          const startDate = new Date(trip.startDate);
          const daysUntilTrip = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilTrip <= 7 && daysUntilTrip > 0) {
            realNotifications.push({
              title: 'Viagem se aproximando',
              message: `"${trip.name}" começa em ${daysUntilTrip} dias`,
              type: 'info',
              category: 'reminder'
            });
          }
        }
      });

      // 6. Check for investment opportunities (high cash balance)
      const totalCash = realAccounts
        .filter((acc: any) => acc.type === 'checking' || acc.type === 'savings')
        .reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
      
      if (totalCash > 5000) {
        realNotifications.push({
          title: 'Oportunidade de investimento',
          message: `Você tem R$ ${totalCash.toFixed(2)} em conta corrente/poupança que poderia estar rendendo mais`,
          type: 'info',
          category: 'investment'
        });
      }

      // 7. Check for overdue reminders
      const overdueReminders = realReminders.filter((reminder: any) => {
        const dueDate = new Date(reminder.dueDate);
        return reminder.status === 'pending' && dueDate < now;
      });
      
      if (overdueReminders.length > 0) {
        realNotifications.push({
          title: 'Lembretes vencidos',
          message: `Você tem ${overdueReminders.length} lembrete(s) vencido(s)`,
          type: 'error',
          category: 'reminder'
        });
      }

      // 8. Check for upcoming reminders (next 3 days)
      const upcomingReminders = realReminders.filter((reminder: any) => {
        const dueDate = new Date(reminder.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        return reminder.status === 'pending' && dueDate >= now && dueDate <= threeDaysFromNow;
      });
      
      if (upcomingReminders.length > 0) {
        upcomingReminders.slice(0, 3).forEach((reminder: any) => {
          const dueDate = new Date(reminder.dueDate);
          const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          realNotifications.push({
            title: `Lembrete: ${reminder.title}`,
            message: `Vence ${daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dias`} - R$ ${reminder.amount?.toFixed(2) || '0,00'}`,
            type: 'warning',
            category: 'reminder'
          });
        });
      }

      // 9. Check for upcoming subscription renewals (next 7 days)
      const upcomingSubscriptions = realSubscriptions.filter((subscription: any) => {
        const nextBilling = new Date(subscription.nextBilling);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return subscription.status === 'active' && nextBilling >= now && nextBilling <= sevenDaysFromNow;
      });
      
      if (upcomingSubscriptions.length > 0) {
        upcomingSubscriptions.slice(0, 3).forEach((subscription: any) => {
          const nextBilling = new Date(subscription.nextBilling);
          const daysUntil = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          realNotifications.push({
            title: `Renovação: ${subscription.name}`,
            message: `Será cobrado ${daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dias`} - R$ ${subscription.amount?.toFixed(2) || '0,00'}`,
            type: 'info',
            category: 'reminder'
          });
        });
      }

      // Add unique notifications (avoid duplicates) - use passed parameter or current state
      const currentNotifications = existingNotifications.length > 0 ? existingNotifications : notifications;
      const existingTitles = currentNotifications.map(n => n.title);
      const uniqueNotifications = realNotifications.filter(n => !existingTitles.includes(n.title));
      
      uniqueNotifications.forEach(notification => {
        addNotification(notification);
      });
    } catch (error) {
      logComponents.error('Error generating real notifications:', error);
    }
  };

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isRead: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    // Also clear from localStorage
    localStorage.removeItem('suagrana-notifications');
  };

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen((prev) => !prev);
  };

  const closeNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };

  const refreshNotifications = () => {
    // Clear existing notifications first to avoid duplicates
    setNotifications([]);
    // Wait for state to clear, then generate new ones
    setTimeout(() => {
      generateRealNotifications([]);
    }, 100);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isNotificationPanelOpen,

        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        toggleNotificationPanel,
        closeNotificationPanel,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
